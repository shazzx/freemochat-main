import {  RouterProvider} from 'react-router-dom'
import { ThemeProvider } from "@/components/theme-provider"
import Toast from './components/Toast'
import { router } from './router'

function App() {

  return (
    <>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <RouterProvider router={router} />
        <Toast />
      </ThemeProvider>
    </>
  )
}

export default App
