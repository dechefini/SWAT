import {
  AlertTriangle,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Command,
  CreditCard,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  LucideProps,
  Moon,
  MoreVertical,
  Pizza,
  Plus,
  Settings,
  SunMedium,
  Trash,
  Twitter,
  User,
  X,
  Shield,
  Database,
  Users,
  Calendar,
  Award,
  BarChart2,
  Briefcase,
  Clipboard,
  FileCheck,
  Star,
  Target,
  Activity,
  AlertCircle,
  Archive,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Home,
  Info,
  Key,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  MoreHorizontal,
  PenTool,
  Percent,
  Phone,
  Play,
  Printer,
  RefreshCw,
  Save,
  Search,
  Share,
  ShoppingCart,
  Sliders,
  Tag,
  ToggleLeft,
  ToggleRight,
  Upload,
  QrCode,
  StopCircle,
  ScanLine,
  Camera,
  Square,
  type LucideIcon,
} from "lucide-react";

export type Icon = LucideIcon;

export const Icons = {
  logo: Command,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  post: FileText,
  page: File,
  media: Image,
  settings: Settings,
  billing: CreditCard,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertTriangle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Pizza,
  sun: SunMedium,
  moon: Moon,
  laptop: Laptop,
  twitter: Twitter,
  check: Check,
  shield: Shield,
  database: Database,
  users: Users,
  calendar: Calendar,
  award: Award,
  chart: BarChart2,
  briefcase: Briefcase,
  clipboard: Clipboard,
  fileCheck: FileCheck,
  star: Star,
  target: Target,
  activity: Activity,
  alertCircle: AlertCircle,
  archive: Archive,
  clock: Clock,
  download: Download,
  externalLink: ExternalLink,
  eye: Eye,
  filter: Filter,
  home: Home,
  info: Info,
  key: Key,
  mail: Mail,
  mapPin: MapPin,
  menu: Menu,
  messageSquare: MessageSquare,
  moreHorizontal: MoreHorizontal,
  penTool: PenTool,
  percent: Percent,
  phone: Phone,
  play: Play,
  printer: Printer,
  refreshCw: RefreshCw,
  save: Save,
  search: Search,
  share: Share,
  shoppingCart: ShoppingCart,
  sliders: Sliders,
  tag: Tag,
  toggleLeft: ToggleLeft,
  toggleRight: ToggleRight,
  upload: Upload,
  qrCode: QrCode,
  scan: ScanLine,
  camera: Camera,
  stop: StopCircle,
  square: Square,
  gitHub: ({ ...props }: LucideProps) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="github"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 496 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"
      ></path>
    </svg>
  ),
  google: ({ ...props }: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className="h-4 w-4"
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <path d="M12 20.96c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10c0 .34-.02.67-.05 1H12v-3.5h7.1c-.6-3.1-3.34-5.5-6.6-5.5-3.87 0-7 3.13-7 7s3.13 7 7 7c1.97 0 3.93-.83 5.31-2.21l2.12 2.12C17.45 19.39 14.97 20.96 12 20.96z" />
      </g>
    </svg>
  ),
};