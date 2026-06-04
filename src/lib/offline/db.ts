import Dexie, { type EntityTable } from 'dexie'

export interface DraftInspection {
  id: string
  assignmentId: string
  productionAgreementId: string
  inspectorId: string
  data: Record<string, unknown>
  photos: { id: string; blob: Blob; caption: string; photoType: string }[]
  createdAt: string
  updatedAt: string
  isSynced: boolean
}

export interface CachedFarmer {
  id: string
  farmerCode: string
  fullName: string
  primaryPhone: string
  village: string
  district: string
  fields: Record<string, unknown>[]
  updatedAt: string
}

export interface CachedAssignment {
  id: string
  productionAgreementId: string
  inspectionNumber: number
  inspectionType: string
  scheduledDate: string
  farmerName: string
  village: string
  fieldCentroidLat: number | null
  fieldCentroidLng: number | null
  cropVariety: string
  status: string
  notesForInspector: string | null
}

export interface SyncQueueItem {
  id: string
  type: 'inspection' | 'photo'
  payload: Record<string, unknown>
  attempts: number
  createdAt: string
}

const db = new Dexie('KoscoSeedsDB') as Dexie & {
  draftInspections: EntityTable<DraftInspection, 'id'>
  cachedFarmers: EntityTable<CachedFarmer, 'id'>
  cachedAssignments: EntityTable<CachedAssignment, 'id'>
  syncQueue: EntityTable<SyncQueueItem, 'id'>
}

db.version(1).stores({
  draftInspections: 'id, assignmentId, isSynced, createdAt',
  cachedFarmers: 'id, farmerCode, village, district',
  cachedAssignments: 'id, scheduledDate, status',
  syncQueue: 'id, type, createdAt',
})

export { db }
