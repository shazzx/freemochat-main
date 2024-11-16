export const getToken = () => {
    const authToken = document.cookie.split(';').find(c => c.startsWith(' accessToken=')) || document.cookie.split(';').find(c => c.startsWith('auth-token=')) || document.cookie.split(';').find(c => c.startsWith('accessToken='));
    let tokenValue: string;
    if (authToken) {
        tokenValue = authToken.split('=')[1];
        return tokenValue
    }
    if (!authToken) {
        console.log(document.cookie)
    }
    return false
}