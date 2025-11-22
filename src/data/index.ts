// Data layer env switch (mock for now)
// TODO: swap to mongo adapter based on VITE_DATA_BACKEND when available

import { templateStore as mock } from '@/data/adapters/templateStore-mock'

export const templateStore = mock
