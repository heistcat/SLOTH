'use client';
import { mockDispatcherData } from '@/lib/mockData';

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dispatcher Dashboard</h1>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 border-b whitespace-nowrap">
              <th className="p-2">ID</th>
              <th className="p-2">Driver Name</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Unit</th>
              <th className="p-2">MC</th>
              <th className="p-2">Notes</th>
              <th className="p-2">Status</th>
              <th className="p-2">Load#</th>
              <th className="p-2">TRL</th>
              <th className="p-2">Distance</th>
              <th className="p-2">PU Time</th>
              <th className="p-2">PU</th>
              <th className="p-2">DEL</th>
              <th className="p-2">VIN</th>
              <th className="p-2">CDL</th>
              <th className="p-2">Odometer</th>
              <th className="p-2">Fuel Level</th>
              <th className="p-2">Deposit</th>
            </tr>
          </thead>
          <tbody>
            {mockDispatcherData.map(row => (
              <tr key={row.id} className="border-b hover:bg-gray-50 whitespace-nowrap">
                <td className="p-2">{row.id}</td>
                <td className="p-2">{row.driverName}</td>
                <td className="p-2">{row.phone}</td>
                <td className="p-2">{row.unit}</td>
                <td className="p-2">{row.mc}</td>
                <td className="p-2">{row.notes}</td>
                <td className="p-2">{row.status}</td>
                <td className="p-2">{row.loadNum}</td>
                <td className="p-2">{row.trl}</td>
                <td className="p-2">{row.distance}</td>
                <td className="p-2">{row.puTime}</td>
                <td className="p-2">{row.pu}</td>
                <td className="p-2">{row.del}</td>
                <td className="p-2">{row.vin}</td>
                <td className="p-2">{row.cdl}</td>
                <td className="p-2">{row.odometer}</td>
                <td className="p-2">{row.fuelLevel}</td>
                <td className="p-2">{row.deposit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
