import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Agency, insertAgencySchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AgencyFormProps {
  agency?: Agency;
  onSubmit: (data: Partial<Agency>) => void;
  onCancel: () => void;
}

export function AgencyForm({ agency, onSubmit, onCancel }: AgencyFormProps) {
  const form = useForm<Partial<Agency>>({
    resolver: zodResolver(insertAgencySchema),
    defaultValues: {
      name: agency?.name || '',
      jurisdiction: agency?.jurisdiction || '',
      populationServed: agency?.populationServed || undefined,
      address: agency?.address || '',
      contactName: agency?.contactName || '',
      contactPosition: agency?.contactPosition || '',
      contactEmail: agency?.contactEmail || '',
      contactPhone: agency?.contactPhone || '',
      totalSwatPersonnel: agency?.totalSwatPersonnel || undefined,
      personnelGaps: agency?.personnelGaps || '',
      tierLevel: agency?.tierLevel || undefined,
    },
  });
  
  const handleSubmit = (data: Partial<Agency>) => {
    console.log('Form submitted with data:', data);
    
    // Log any form errors for debugging purposes
    if (Object.keys(form.formState.errors).length > 0) {
      console.error('Form validation errors:', form.formState.errors);
    }
    
    // Make sure all required fields are correctly set
    if (!data.name || !data.contactEmail) {
      console.error('Required fields missing in form data');
      if (!data.name) {
        form.setError('name', { 
          type: 'manual', 
          message: 'Agency name is required' 
        });
      }
      if (!data.contactEmail) {
        form.setError('contactEmail', { 
          type: 'manual', 
          message: 'Contact email is required' 
        });
      }
      return;
    }
    
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agency Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter agency name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jurisdiction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jurisdiction</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value || undefined} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select jurisdiction" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="county">County</SelectItem>
                      <SelectItem value="state">State</SelectItem>
                      <SelectItem value="federal">Federal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="populationServed"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Population Served</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      value={value || ''}
                      onChange={event => onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter agency address" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary Contact Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter contact name" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPosition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position/Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter position" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="Enter email" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter phone number" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle>Team Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="totalSwatPersonnel"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Total SWAT Personnel</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      value={value || ''}
                      onChange={event => onChange(event.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="personnelGaps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personnel Gaps</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe any personnel gaps" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tierLevel"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>SWAT Tier Level</FormLabel>
                  <Select 
                    onValueChange={(val) => onChange(val ? parseInt(val) : undefined)} 
                    defaultValue={value?.toString() || undefined} 
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Not assessed</SelectItem>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                      <SelectItem value="4">Tier 4</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="submit" size="lg">
            {agency ? 'Update Agency' : 'Create Agency'}
          </Button>
        </div>
      </form>
    </Form>
  );
}