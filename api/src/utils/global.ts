export const checkForSpecialMentions = (content: string): boolean => {
    return /@followers\b/i.test(content);
}

export const extractFilename = (url: string): string => {
    const parts = url.split("/");
    return parts[parts.length - 1] || '';
}