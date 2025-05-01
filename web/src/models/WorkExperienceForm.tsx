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
});

export default function WorkExperienceForm({ setOpen, onSave, existingData = null }) {
    // Set form title based on whether we're editing or creating
    const formTitle = existingData ? "Edit Work Experience" : "Add Work Experience";
    
    const form = useForm({
        resolver: yupResolver(workExperienceSchema),
        defaultValues: existingData || {
            jobTitle: '',
            company: '',
            totalYears: '',
            description: '',
        }
    });

    const handleSubmit = (data) => {
        // Convert totalYears to number
        data.totalYears = Number(data.totalYears);
        
        onSave(data, existingData ? true : false);
        setOpen(false);
    };

    return (
        <Dialog open={true} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{formTitle}</DialogTitle>
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
                                            placeholder="Experience" 
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
                            <Button type="submit">{existingData ? "Update" : "Save"}</Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}