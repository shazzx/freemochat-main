export const setMediaModelDetails = (media, setMediaOpenDetails, setMediaOpenModel, type) => {
    setMediaOpenModel(true)
    setMediaOpenDetails({ type, url: media })
}