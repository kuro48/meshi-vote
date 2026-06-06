import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from '@/routes/home/HomePage'
import { RoomLayout } from '@/routes/room/RoomLayout'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/room/:code', element: <RoomLayout /> },
])

export default function App() {
  return <RouterProvider router={router} />
}
