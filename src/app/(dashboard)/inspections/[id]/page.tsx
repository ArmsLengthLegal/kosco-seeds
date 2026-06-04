export default function ConductInspectionPage({ params }: { params: { id: string } }) {
  return <div><h1 className="text-2xl font-bold text-gray-900">Conduct Inspection</h1><p className="text-gray-400 text-sm mt-1">Assignment: {params.id}</p></div>
}
