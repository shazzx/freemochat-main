import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider } from 'react-redux'
import { store } from './app/store.ts'

console.log = () => { };
console.warn = () => { };
console.error = () => { };
console.debug = () => { };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <BrowserRouter>
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </Provider>
  // </BrowserRouter>
)
