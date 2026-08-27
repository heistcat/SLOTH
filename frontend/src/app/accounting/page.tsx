'use client';
import { mockAccountingData } from '@/lib/mockData';

export default function Accounting() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Accounting Screen</h1>
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-200 border-b whitespace-nowrap">
              <th className="p-2">ID</th>
              <th className="p-2">Load</th>
              <th className="p-2">Status</th>
              <th className="p-2">Price</th>
              <th className="p-2">Paycheck</th>
              <th className="p-2">Mile</th>
              <th className="p-2">Cash Advance</th>
              <th className="p-2">Reimbursement</th>
              <th className="p-2">TRL Rent</th>
              <th className="p-2">Truck Rent</th>
              <th className="p-2">Fuel</th>
              <th className="p-2">Driver Expense</th>
              <th className="p-2">Deposit</th>
            </tr>
          </thead>
          <tbody>
            {mockAccountingData.map(row => (
              <tr key={row.id} className="border-b hover:bg-blue-100 cursor-pointer transition-colors duration-150 whitespace-nowrap">
                <td className="p-2">{row.id}</td>
                <td className="p-2">{row.load}</td>
                <td className="p-2">{row.status}</td>
                <td className="p-2">{row.price}</td>
                <td className="p-2">{row.paycheck}</td>
                <td className="p-2">{row.mile}</td>
                <td className="p-2">{row.cashAdvance}</td>
                <td className="p-2">{row.reimbursement}</td>
                <td className="p-2">{row.trlRent}</td>
                <td className="p-2">{row.truckRent}</td>
                <td className="p-2">{row.fuel}</td>
                <td className="p-2">{row.driverExpense}</td>
                <td className="p-2">{row.deposit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
