import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"

// Schema matching your React Native implementation
const workExperienceSchema = yup.object().shape({
  jobTitle: yup.string().required('Job title is required'),
  company: yup.string().required('Company is required'),
  totalYears: yup.number().required('Years of experience is required').positive(),
  description: yup.string(),
  current: yup.boolean()
});

export default function WorkExperienceForm({ setOpen, onSave }) {
    const [currentlyWorking, setCurrentlyWorking] = useState(false);
    
    const form = useForm({
        resolver: yupResolver(workExperienceSchema),
        defaultValues: {
            jobTitle: '',
            company: '',
            totalYears: '',
            description: '',
            current: false
        }
    });

    const handleSubmit = (data) => {
        // Convert totalYears to number
        data.totalYears = Number(data.totalYears);
        
        // If currently working, handle accordingly
        if (data.current) {
            data.endDate = null;
        }
        
        onSave(data);
        setOpen(false);
    };

    return (
        <Dialog open={true} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Work Experience</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="jobTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Job Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Software Engineer, Project Manager, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Company</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Company name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="totalYears"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Years of Experience</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="number" 
                                            placeholder="2" 
                                            step="0.1"
                                            {...field}
                                            value={field.value || ''}
                                            onChange={(e) => field.onChange(e.target.value)} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="current"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <Checkbox 
                                            checked={field.value}
                                            onCheckedChange={(checked) => {
                                                field.onChange(checked);
                                                setCurrentlyWorking(checked);
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">Currently Working Here</FormLabel>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Brief description of your role and responsibilities" 
                                            rows={3}
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}