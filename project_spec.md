# Logistics CRM System - Specification

## 1. Roles and User Types (Permission Management System)

* **Superadmin**: Developer account with full system access.
* **Admin**: Tech support team with all main permissions per client.
* **Manager**: Client's main account; has the authority to create and manage *Supervisors*.
* **Supervisor** ("Gruppenführer"): Oversees operations and can create *Dispatchers*.
* **Dispatcher**: Main workers who manage the daily logistics and interact with the main dataframe.
* **Maintenance**: 
  * Cannot delete data.
  * Can update specific information (e.g., VIN).
  * Can upload documents such as Truck docs, Driver docs, and Agreements.
* **Accounting**:
  * Cannot delete information from tables.
  * Can upload accounting-related documents.
  * Can send bills from the service.

## 2. Main Screen (Dispatcher Dataframe)

The main dashboard is a spreadsheet-like interface (similar to Google Sheets) where dispatchers can view and manage data. It contains the following columns:

| Column Name | Description |
| :--- | :--- |
| `id` | Unique identifier for the record |
| `driver name` | Name of the assigned driver |
| `phone` | Driver's contact number |
| `unit` | Truck/Unit identifier |
| `mc` | Motor Carrier number |
| `notes` | Additional context or comments |
| `status` | Current status of the load/driver |
| `load#` | Unique Load number |
| `TRL` | Trailer identifier |
| `distance` | Total distance for the trip |
| `PU time` | Pick Up time |
| `PU` | Pick Up location |
| `DEL` | Delivery location |
| `Vin number` | Vehicle Identification Number |
| `CDL` | Commercial Driver's License details |
| `Odometer` | Current odometer reading |
| `fuel level` | Current fuel level |
| `deposit` | Deposit amount/details |

## 2.1 Accounting Screen (Specific to Accounting Role)

A specialized view for the **Accounting** role containing the following columns:

| Column Name | Description |
| :--- | :--- |
| `load` | Load identifier |
| `status` | Current load/driver status |
| `price` | Price (Prive) |
| `paycheck` | Paycheck amount |
| `mile` | Miles driven / billed |
| `cash advance` | Cash advance provided |
| `reimbursement` | Reimbursement amounts |
| `TRL rent` | Trailer rental cost |
| `truck rent` | Truck rental cost |
| `fuel` | Fuel costs |
| `driver expense` | Driver expenses |
| `deposit` | Deposit amount |

## 3. Tech Stack
* **Frontend**: Next.js
* **Backend**: Go
* **Database**: PostgreSQL

## 4. 3rd Party Integrations
* **Samsara API**
* **Motive API**
* **TT ELD API**
