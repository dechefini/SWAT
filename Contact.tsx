
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#111] pt-20">
      <Card className="w-full max-w-lg mx-4 bg-white">
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contact Sales</h1>
          <form className="space-y-4">
            <div>
              <label className="text-sm text-gray-600">Name</label>
              <Input type="text" placeholder="Your name" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <Input type="email" placeholder="your@email.com" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Message</label>
              <Textarea placeholder="How can we help?" className="h-32" />
            </div>
            <Button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black">
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
