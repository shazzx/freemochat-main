export const checkForSpecialMentions = (content: string): boolean => {
    return /@followers\b/i.test(content);
}
