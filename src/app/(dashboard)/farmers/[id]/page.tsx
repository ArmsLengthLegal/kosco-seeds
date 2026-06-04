export default function FarmerProfilePage({ params }: { params: { id: string } }) {
  return <div><h1 className="text-2xl font-bold text-gray-900">Farmer Profile</h1><p className="text-gray-400 text-sm mt-1">ID: {params.id}</p></div>
}
