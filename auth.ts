import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPgSimple from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  console.log('Hashing new password');
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePasswords(supplied: string, stored: string) {
  console.log('Comparing passwords');
  try {
    const result = await bcrypt.compare(supplied, stored);
    console.log('Password comparison result:', result);
    return result;
  } catch (error) {
    console.error('Error during password comparison:', error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const PostgresStore = connectPgSimple(session);

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    store: new PostgresStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    })
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      async (req, email, password, done) => {
        try {
          console.log(`Attempting login for email: ${email}`);
          const user = await storage.getUserByEmail(email);

          if (!user) {
            console.log('User not found');
            return done(null, false, { message: 'Invalid email or password' });
          }

          console.log('Found user:', { email: user.email, id: user.id });
          const isValidPassword = await comparePasswords(password, user.passwordHash);

          if (!isValidPassword) {
            console.log('Invalid password');
            return done(null, false, { message: 'Invalid email or password' });
          }

          // Handle interface type selection
          const interfaceType = req.body.interfaceType;
          if (interfaceType) {
            console.log(`User selected interface: ${interfaceType}`);
            
            // If SWAT Tracking is selected, verify agency has paid status
            if (interfaceType === 'tracking' && user.agencyId) {
              const agency = await storage.getAgency(user.agencyId);
              if (agency && agency.paidStatus !== true) {
                console.log('Premium feature requested for non-premium agency');
                return done(null, false, { 
                  message: 'SWAT Tracking requires a premium subscription. Please contact your administrator.' 
                });
              }
            }
            
            // Update user's interface preference
            await storage.updateUser(user.id, { interfaceType });
            user.interfaceType = interfaceType;
          }

          console.log('Login successful');
          return done(null, user);
        } catch (err) {
          console.error('Login error:', err);
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      console.log('Deserializing user:', id);
      const user = await storage.getUser(id);
      if (!user) {
        console.log('User not found during deserialization');
        return done(null, false);
      }
      done(null, user);
    } catch (err) {
      console.error('Deserialization error:', err);
      done(err);
    }
  });
}