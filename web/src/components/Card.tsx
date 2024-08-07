// @ts-ignore

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export function SimpleCard({ title, content }) {
    return (
        <Card className="w-full border-primary">
            <CardHeader>
                <CardTitle className="text-base font-medium">{title}</CardTitle>
                {/* <CardDescription>Deploy your new project in one-click.</CardDescription> */}
            </CardHeader>
            <CardContent className="text-2xl font-bold">
                {content}
            </CardContent>
        </Card>
    )
}
