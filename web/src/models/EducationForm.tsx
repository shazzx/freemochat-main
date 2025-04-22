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
const educationSchema = yup.object().shape({
  institution: yup.string().required('Institution is required'),
  degree: yup.string().required('Degree is required'),
  fieldOfStudy: yup.string().required('Field of study is required'),
  startYear: yup.number().required('Start year is required').positive().integer(),
  endYear: yup.number().nullable().transform((value) => (isNaN(value) ? null : value)),
  description: yup.string(),
  current: yup.boolean()
});

export default function EducationForm({ setOpen, onSave }) {
    const [isCurrentlyStudying, setIsCurrentlyStudying] = useState(false);
    
    const form = useForm({
        resolver: yupResolver(educationSchema),
        defaultValues: {
            institution: '',
            degree: '',
            fieldOfStudy: '',
            startYear: new Date().getFullYear(),
            endYear: null,
            description: '',
            current: false
        }
    });

    const handleSubmit = (data) => {
        // If currently studying, set endYear to null
        if (data.current) {
            data.endYear = null;
        }
        
        onSave(data);
        setOpen(false);
    };

    return (
        <Dialog open={true} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Education</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="institution"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Institution</FormLabel>
                                    <FormControl>
                                        <Input placeholder="University or School name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="degree"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Degree</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Bachelor's, Master's, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="fieldOfStudy"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Field of Study</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Computer Science, Biology, etc." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-4">
                            <FormField
                                control={form.control}
                                name="startYear"
                                render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel>Start Year</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="2018" 
                                                type="number"
                                                {...field}
                                                onChange={(e) => field.onChange(parseInt(e.target.value) || '')} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!isCurrentlyStudying && (
                                <FormField
                                    control={form.control}
                                    name="endYear"
                                    render={({ field }) => (
                                        <FormItem className="flex-1">
                                            <FormLabel>End Year</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    placeholder="2022" 
                                                    type="number"
                                                    {...field}
                                                    value={field.value || ''}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || null)} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

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
                                                setIsCurrentlyStudying(checked);
                                                if (checked) {
                                                    form.setValue('endYear', null);
                                                }
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-normal">Currently Studying</FormLabel>
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
                                            placeholder="Brief description of your studies" 
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