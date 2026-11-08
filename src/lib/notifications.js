import { toast } from 'sonner'
export const notifications = { show: ({ title, message, color }) => color === 'red' ? toast.error(title || message, { description: title ? message : undefined }) : toast.success(title || message, { description: title ? message : undefined }) }
