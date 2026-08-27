export const mockDispatcherData = [
  { id: '1', driverName: 'John Doe', phone: '555-0101', unit: 'U-101', mc: 'MC-12345', notes: 'Needs new tires', status: 'On Route', loadNum: 'L-9981', trl: 'T-55', distance: '450 mi', puTime: '08:00 AM', pu: 'Chicago, IL', del: 'Detroit, MI', vin: '1HGCM82633A', cdl: 'CDL-123', odometer: '120,000', fuelLevel: '75%', deposit: '$500' },
  { id: '2', driverName: 'Jane Smith', phone: '555-0102', unit: 'U-102', mc: 'MC-12346', notes: '', status: 'Available', loadNum: '-', trl: 'T-56', distance: '-', puTime: '-', pu: '-', del: '-', vin: '1HGCM82633B', cdl: 'CDL-124', odometer: '85,000', fuelLevel: '100%', deposit: '$500' },
];

export const mockAccountingData = [
  { id: '1', load: 'L-9981', status: 'Invoiced', price: '$1,200', paycheck: '$800', mile: '450', cashAdvance: '$100', reimbursement: '$0', trlRent: '$50', truckRent: '$150', fuel: '$200', driverExpense: '$20', deposit: '$500' },
  { id: '2', load: 'L-9982', status: 'Pending', price: '$900', paycheck: '$600', mile: '300', cashAdvance: '$0', reimbursement: '$50', trlRent: '$50', truckRent: '$150', fuel: '$120', driverExpense: '$0', deposit: '$500' },
];

export const roles = ['Superadmin', 'Admin', 'Manager', 'Supervisor', 'Dispatcher', 'Maintenance', 'Accounting'];
