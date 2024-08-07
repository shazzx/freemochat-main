export const getFileType = (mimetype: string) => {
    if (mimetype.startsWith("image/")) {
        return 'image'
    }
    if (mimetype.startsWith("video/")) {
        return 'video'
    }
}
