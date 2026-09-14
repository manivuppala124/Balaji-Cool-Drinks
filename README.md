# 🥤 Sri Balaji Cool Drinks & General Store

<p align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="status" />
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-339933?logo=node.js&logoColor=white" alt="node" />
  <img src="https://img.shields.io/badge/frontend-React%2018%20%2B%20Vite%208-61DAFB?logo=react&logoColor=black" alt="react" />
  <img src="https://img.shields.io/badge/backend-Express%20%2B%20MongoDB-47A248?logo=mongodb&logoColor=white" alt="mongo" />
  <img src="https://img.shields.io/badge/license-Proprietary-lightgrey" alt="license" />
</p>

<p align="center">
A modern, full-stack, <b>dual-mode (Retail + Wholesale)</b> e-commerce and store management platform built specifically for the day-to-day operations of <b>Sri Balaji Cool Drinks & General Store</b>.
</p>

The platform gives regular shoppers and bulk wholesale buyers (kirana stores, restaurants, event organizers, catering services) a smooth, mobile-first ordering experience, while giving the store owner a centralized, real-time admin panel to manage catalog variants, live stock, orders, customers, and sales reports — all without paying a single rupee in payment-gateway fees.

---

## Table of Contents

1. [Business Model & System Concept](#business-model--system-concept)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Project Directory Structure](#project-directory-structure)
5. [Core Features](#core-features)
   - [Customer Application](#customer-application)
   - [Dual-Mode Shopping (Retail & Wholesale)](#dual-mode-shopping-retail--wholesale)
   - [Admin Control Center](#admin-control-center)
   - [Inventory & Stock Management](#inventory--stock-management)
6. [Pricing & Pack Calculation Engine](#pricing--pack-calculation-engine)
7. [Default Product Catalog & Pricing Table](#default-product-catalog--pricing-table)
8. [Database Architecture & Data Models](#database-architecture--data-models)
9. [REST API Documentation](#rest-api-documentation)
10. [Environment Variables Reference](#environment-variables-reference)
11. [Installation & Setup Guide](#installation--setup-guide)
12. [Seeding & Database Utilities](#seeding--database-utilities)
13. [Running the Application](#running-the-application)
14. [Testing & Verification](#testing--verification)
15. [Production Deployment Guide](#production-deployment-guide)
16. [Security & Data Integrity](#security--data-integrity)
17. [Performance & Scalability Notes](#performance--scalability-notes)
18. [Roadmap](#roadmap)
19. [Contributing](#contributing)
20. [Troubleshooting & FAQ](#troubleshooting--faq)
21. [License](#license)

---

## Business Model & System Concept

**Sri Balaji Cool Drinks & General Store** operates as a hybrid local Indian merchant:

- **Retail Customers**: Buy individual cold drinks, water bottles, and packaged snacks in piece quantities (1–10 bottles) for instant consumption or family use.
- **Wholesale Customers**: Buy bulk cases/crates (e.g., 6, 12, 24, 48, or 50 bottles per case) at discounted tier prices for local functions, celebrations, or resale in neighborhood stores.
- **No Third-Party Payment Gateway Friction**: Eliminates merchant gateway fees, transaction charges, and payment gateway failures. Customers choose **Cash at Store / Cash on Delivery** or **Manual UPI** (pay directly via QR code or mobile number upon delivery/pickup).
- **Server-Authoritative Pricing**: Zero client trust. Front-end cart totals and item discounts are strictly re-verified and computed on the Node.js backend using live MongoDB variant records.

---

## Technology Stack

### Frontend Client

| Technology | Purpose |
|---|---|
| **React 18** | Declarative component-driven UI library |
| **Vite 8** | Ultra-fast bundling, HMR, and development tooling |
| **Tailwind CSS** | Utility-first CSS framework for a clean, responsive UI |
| **React Router v6** | Client-side routing with nested layout routes & route guards |
| **Axios** | HTTP client with automatic JWT bearer token interceptors |
| **React Context API** | Application state management (`AuthContext`, `CartContext`) |
| **Lucide React** | Consistent, modern iconography |
| **Recharts** | Interactive charts for sales analytics and the admin dashboard |
| **Sonner** | Modern toast notifications |
| **vite-plugin-pwa** | Progressive Web App support (offline precaching, install banner) |

### Backend Server

| Technology | Purpose |
|---|---|
| **Node.js (v18+ / v20 / v22 / v24)** | Modern ES Modules JavaScript runtime |
| **Express.js** | RESTful HTTP routing and API middleware |
| **MongoDB Atlas / Local MongoDB** | Document-oriented NoSQL database |
| **Mongoose ODM (v8+)** | Schema modeling, validation, and middleware |
| **JSON Web Tokens (jsonwebtoken)** | Stateless JWT authorization |
| **bcryptjs** | Salted password hashing (12 rounds) |
| **Helmet & CORS** | Security headers and strict cross-origin resource sharing |
| **express-rate-limit** | Protection against API brute-force attacks |
| **express-mongo-sanitize** | Defense against NoSQL injection queries |

---

## System Architecture

```
                                  +-----------------------------+
                                  |   Customer / Admin Client   |
                                  |    (React + Vite + PWA)     |
                                  +--------------+--------------+
                                                 |
                                     HTTPS / REST (JSON + JWT)
                                                 |
                                                 v
+-----------------------------------------------------------------------------------------------+
|                                      Node.js Express Server                                   |
|                                                                                               |
|  +--------------------+   +---------------------+   +--------------------+   +-------------+  |
|  |  Security & CORS   |-->|   Auth & RBAC JWT   |-->|  Route Controllers |-->| Settings &  |  |
|  | (Helmet, Sanitize) |   |  (User / Admin)     |   |  (Orders, Catalog) |   | Audit Logs  |  |
|  +--------------------+   +---------------------+   +---------+----------+   +-------------+  |
+---------------------------------------------------------------|-------------------------------+
                                                                |
                                                Mongoose Schema & Operations
                                                                |
                                                                v
+-----------------------------------------------------------------------------------------------+
|                                            MongoDB                                            |
|                                                                                               |
|   Users        Categories     Products & Variants     Orders       InventoryTx     Settings   |
+-----------------------------------------------------------------------------------------------+
```

### Request Lifecycle (example: placing an order)

```
Client (Cart) → POST /api/orders → protect (JWT) → orderController.createOrder
   → resolve each item's variant from MongoDB (server-authoritative price/stock)
   → runWithOptionalTransaction (atomic if replica set, safe fallback otherwise)
   → deduct stock + write InventoryTransaction ledger entries
   → persist Order + timeline entry ("PENDING")
   → notificationService → create in-app notification
   → respond with { success, data: order }
```

---

## Project Directory Structure

```
Shop/
├── client/                               # Frontend React Single Page Application
│   ├── public/                           # Static assets, favicon, manifest icons
│   │   ├── favicon.svg
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── src/
│   │   ├── components/                   # Reusable UI building blocks
│   │   │   ├── AdminLayout.jsx           # Sidebar + header layout for admin panel
│   │   │   ├── CustomerLayout.jsx        # Navbar + footer layout with mode toggle
│   │   │   ├── EmptyState.jsx            # Fallback illustration for empty views
│   │   │   ├── Footer.jsx                # Store hours, address & WhatsApp contact
│   │   │   ├── Navbar.jsx                # Responsive header, search bar, mode switch, cart pill
│   │   │   ├── OrderStatusBadge.jsx      # Color-coded badges for order states
│   │   │   ├── ProductCard.jsx           # Catalog item card with live variant selector & stepper
│   │   │   └── ProtectedRoute.jsx        # Auth and role-based redirect guards
│   │   ├── context/                      # Global State Providers
│   │   │   ├── AuthContext.jsx           # User authentication, token lifecycle & profile
│   │   │   └── CartContext.jsx           # Mixed retail/wholesale cart management & persistence
│   │   ├── pages/                        # Route Pages
│   │   │   ├── About.jsx                 # Store story, timings, and contact details
│   │   │   ├── Addresses.jsx             # Customer delivery address manager
│   │   │   ├── Cart.jsx                  # Line-item review with Wholesale Case vs Retail Piece badges
│   │   │   ├── Checkout.jsx              # Address selection, order notes, payment mode choice
│   │   │   ├── Home.jsx                  # Hero banner, category rail, featured drinks, wholesale strip
│   │   │   ├── Login.jsx                 # Customer mobile/email login
│   │   │   ├── MyOrders.jsx              # Customer order history list
│   │   │   ├── OrderDetails.jsx          # Live order timeline tracker and itemized receipt
│   │   │   ├── OrderSuccess.jsx          # Post-checkout confirmation screen
│   │   │   ├── ProductDetails.jsx        # In-depth product view, pack size breakdown & bulk actions
│   │   │   ├── Products.jsx              # Filterable, searchable, sortable catalog page
│   │   │   ├── Profile.jsx               # Customer account details & security
│   │   │   ├── Register.jsx              # Customer account registration
│   │   │   └── admin/                    # Admin Control Center Pages
│   │   │       ├── Customers.jsx         # Customer directory & wholesale approval switches
│   │   │       ├── Dashboard.jsx         # Real-time metrics & Recharts sales analytics
│   │   │       ├── Inventory.jsx         # Live stock levels, low-stock alerts & stock adjustments
│   │   │       ├── Login.jsx             # Dedicated administrator portal login
│   │   │       ├── Orders.jsx            # Order management, filter by status/type, status updates
│   │   │       ├── Products.jsx          # Complete CRUD for products & multi-variant pricing
│   │   │       ├── Reports.jsx           # Sales reports, revenue trends, top-selling drinks
│   │   │       └── Settings.jsx          # Shop hours, delivery thresholds, order switches
│   │   ├── services/
│   │   │   ├── api.js                    # Axios instance with auth interceptor
│   │   │   └── endpoints.js              # Centralized API service methods
│   │   ├── utils/
│   │   │   └── format.js                 # Indian currency formatter (₹), date & stock helpers
│   │   ├── App.jsx                       # Master router configuration
│   │   ├── index.css                     # Tailwind design tokens and custom utility classes
│   │   └── main.jsx                      # React root mount and PWA registration
│   ├── index.html                        # HTML entry point with metadata
│   ├── package.json                      # Frontend dependencies and scripts
│   ├── tailwind.config.js                # Custom color palette (brand green, amber, ink)
│   └── vite.config.js                    # Vite configuration with PWA plugin
│
├── server/                               # Backend Node.js Express API
│   ├── src/
│   │   ├── config/                       # Core configuration
│   │   │   ├── constants.js              # Order status workflows, roles, transaction types
│   │   │   └── db.js                     # MongoDB connection handler with retry logic
│   │   ├── controllers/                  # Route business logic
│   │   │   ├── adminController.js        # Analytics aggregation, customer management, inventory
│   │   │   ├── authController.js         # JWT generation, registration, password hashing
│   │   │   ├── catalogController.js      # Product listing, filtering, search, category queries
│   │   │   ├── orderController.js        # Dynamic pricing resolution, stock deduction, order placement
│   │   │   └── settingsController.js     # Shop settings retrieval and admin updates
│   │   ├── middlewares/                  # Express Middlewares
│   │   │   ├── auth.js                   # JWT verification & role authorization (`protect`, `adminOnly`)
│   │   │   ├── error.js                  # Centralized error handler and uncaught exception capture
│   │   │   └── validate.js               # Payload validation handlers
│   │   ├── models/                       # Mongoose Schemas & Models
│   │   │   ├── AuditLog.js               # History of admin actions and sensitive updates
│   │   │   ├── Category.js               # Product category taxonomy
│   │   │   ├── Counter.js                # Auto-incrementing order sequence numbers
│   │   │   ├── InventoryTransaction.js   # Immutable stock ledger (SALE, RESTOCK, ADJUSTMENT)
│   │   │   ├── Notification.js           # In-app customer & admin notifications
│   │   │   ├── Order.js                  # Orders with status, items, address, payment mode
│   │   │   ├── Product.js                # Products with embedded variant subdocuments
│   │   │   ├── ShopSettings.js           # Shop operational configuration and toggles
│   │   │   └── User.js                   # Customer and admin user profiles
│   │   ├── routes/                       # API Route Declarations
│   │   │   ├── adminRoutes.js            # Admin-only endpoints (`/api/admin/*`)
│   │   │   ├── authRoutes.js             # Authentication endpoints (`/api/auth/*`)
│   │   │   ├── catalogRoutes.js          # Public product catalog (`/api/products`, `/api/categories`)
│   │   │   ├── orderRoutes.js            # Order placement & tracking (`/api/orders/*`)
│   │   │   └── settingsRoutes.js         # Shop settings (`/api/settings`)
│   │   ├── scripts/                      # Management & Maintenance Scripts
│   │   │   ├── seed.js                   # Complete database seed with categories, admin & 23 products
│   │   │   ├── update_pricing.js         # Bulk pricing and pack size sync utility
│   │   │   ├── setWholesaleSetting.js    # Script to toggle wholesale approval requirement
│   │   │   ├── test_order_flow.js        # Resolution verification script
│   │   │   └── test_create_order.js      # End-to-end mixed retail & wholesale order verification
│   │   ├── services/                     # Reusable business services
│   │   │   ├── auditService.js           # System audit logging
│   │   │   ├── notificationService.js    # In-app notifications
│   │   │   └── settingsService.js        # Cached shop settings helper
│   │   └── utils/
│   │       ├── AppError.js               # Custom operational error class and async wrapper
│   │       └── helpers.js                # Standalone vs replica set transaction executor
│   ├── package.json                      # Backend dependencies and scripts
│   ├── server.js                         # Application entrypoint & HTTP server bootstrap
│   └── .env.example                      # Template for backend environment variables
│
├── package.json                          # Root repository orchestration scripts
└── README.md                             # Complete project documentation (this file)
```

---

## Core Features

### Customer Application

- **Visual Catalog & Instant Filtering**
  - Filter by category (Cool Drinks, Mineral Water, Juices, Dairy Drinks, Energy Drinks, Soda, ORS, Disposables, General Store).
  - Search by product name, brand (Coca-Cola, Tata, Bisleri, Campa, Parle Agro, etc.), or tags.
  - Sort by popularity, price (low to high / high to low), and in-stock status.
- **Variant Selector**
  - Products contain multiple volume variants (e.g. Sprite: `250 ml`, `750 ml`, `1.25 L`, `2.25 L`).
  - Switching variants updates the price, MRP discount, wholesale case details, and stock badge instantly without reloading.
- **Delivery Address Manager**
  - Save multiple delivery addresses with contact names, mobile numbers, door/street addresses, landmarks, and pincodes.
  - Mark a default address for 1-click checkout.
- **Order Tracking & Invoice**
  - Visual status timeline: `PENDING` → `CONFIRMED` → `PACKED` → `OUT_FOR_DELIVERY` → `DELIVERED`.
  - Itemized breakdown showing unit prices, pack quantities, delivery fee, and net total.
  - Formatted print view suitable for customer receipts.
- **Progressive Web App (PWA)**
  - Installable directly to the home screen on Android, iOS, tablet, and desktop Chrome.
  - Fast page navigation cached via service workers, with graceful offline fallbacks.

---

### Dual-Mode Shopping (Retail & Wholesale)

The application solves the unique challenge of running a store that caters simultaneously to individual retail customers and commercial wholesale buyers.

```
       +-------------------------------------------------------+
       |             Active Browsing Mode Switcher             |
       |             [ RETAIL ]       [ WHOLESALE ]            |
       +---------------------------+---------------------------+
                                   |
         +-------------------------+-------------------------+
         |                                                   |
         v                                                   v
   RETAIL MODE                                         WHOLESALE MODE
- Price displayed: Single Piece Retail Price        - Price displayed: Case Price + Per-piece rate
- Stepper increments by: 1 Bottle/Piece             - Stepper increments by: 1 Full Case (e.g. 24 pcs)
- Unit of sale: PIECE                               - Unit of sale: CASE (or wholesale piece)
- Added to cart as: Retail Piece                    - Added to cart as: Wholesale Case
```

#### Key Capabilities

1. **No Separate Accounts Required**: Regular customers and wholesale buyers use the same platform. Any customer can purchase bulk cases or individual pieces without artificial account barriers.
2. **True Mixed Carts**: Customers can browse in Retail mode to add 2 single cold drinks, switch to Wholesale mode to add 1 wholesale case of water bottles, and proceed to a single unified checkout.
3. **Transparent Cart Line Items**
   - Each item in the cart explicitly indicates whether it was added as a `Wholesale Case`, `Wholesale Piece`, or `Retail Piece`.
   - Case items clearly show the case count and total unit count (e.g., `1 case(s) (24 bottles/case)`).
   - Quantity controls adapt intelligently: clicking `+` on a case item increments by 1 full case (24 units), while clicking `+` on a retail item increments by 1 bottle.
4. **Independent Stock Deduction**
   - Whether an item is purchased as a retail piece or a wholesale case, stock in MongoDB is strictly tracked at the individual piece level. Ordering 2 cases of 24 bottles accurately deducts 48 units from the variant's stock.

---

### Admin Control Center

Access the admin dashboard by navigating to `/admin/login` using your administrator credentials.

- **Real-Time KPI Dashboard**
  - Today's Revenue and Lifetime Revenue.
  - Order Count (Total, Pending, Completed).
  - Active Registered Customers.
  - Low-stock and out-of-stock items requiring immediate attention.
- **Visual Analytics**
  - Daily sales trend graphs using Recharts.
  - Category-wise revenue distribution.
  - Order volume breakdown (Retail vs Wholesale).
- **Comprehensive Order Management**
  - Filter orders by status (`PENDING`, `CONFIRMED`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).
  - Filter by order type (`RETAIL` vs `WHOLESALE`).
  - Search by order number (e.g. `SB-2026-000001`), customer name, or phone number.
  - 1-click status transitions with automatic in-app notifications generated for the customer.
- **Product & Variant Catalog Editor**
  - Add, edit, or deactivate products and categories.
  - Configure multiple variants per product with individual MRP, Retail Price, Wholesale Price, Wholesale Case Price, Pack Size, and Pack Unit.
  - Assign SKUs, Barcodes, and custom image URLs.
- **Customer Directory**
  - View all registered customers, total orders placed, and lifetime spend.
  - Toggle wholesale verification flags.
- **Store Operations & Settings**
  - Configure shop name, contact number, WhatsApp number, and address.
  - Set opening and closing hours.
  - Configure delivery fee and free delivery threshold.
  - Toggle payment mode availability (Allow Cash, Allow UPI).
  - Toggle wholesale ordering permissions.

---

### Inventory & Stock Management

- **Live Inventory Ledger**: Real-time stock audit list showing every variant across all products, with color-coded low-stock and out-of-stock badges.
- **Quick Stock Corrections**: Perform restocks or corrections with mandatory reason logging (`RESTOCK`, `CORRECTION`, `DAMAGE`, `RETURN`).
- **Immutable Audit Trail**: Every stock movement is written to the `InventoryTransaction` ledger, capturing previous stock, new stock, quantity delta, reference order/memo, and the admin user who made the change — nothing is ever silently overwritten.
- **Per-Piece Accuracy**: Stock is always tracked in individual units regardless of whether the sale was a retail piece or a wholesale case, keeping the dashboard numbers trustworthy at any zoom level.

---

## Pricing & Pack Calculation Engine

The platform implements a server-authoritative pricing resolution algorithm in [`server/src/controllers/orderController.js`](file:///c:/Users/manik/OneDrive/Desktop/Shop/server/src/controllers/orderController.js) that eliminates cart errors and prevents manipulation:

### Case Calculation Formula

When an order item has `sellingUnit === 'CASE'`:

1. **Pack Size (`packSize`)**: Obtained from `variant.wholesalePackSize` (defaults to 1 if not set).
2. **Case Price (`casePrice`)**:
   $$\text{Case Price} = \text{variant.wholesaleCasePrice} \parallel (\text{variant.wholesalePrice} \times \text{packSize}) \parallel (\text{variant.retailPrice} \times \text{packSize} \times 0.90)$$
3. **Effective Per-Piece Unit Price**:
   $$\text{Unit Price} = \frac{\text{Case Price}}{\text{packSize}}$$
4. **Total Pieces Deducted From Inventory**:
   $$\text{Total Deducted Stock} = \text{casesOrdered} \times \text{packSize}$$
5. **Line Item Subtotal**:
   $$\text{Line Subtotal} = \text{Case Price} \times \text{casesOrdered}$$

### Piece Calculation Formula

When an item has `sellingUnit === 'PIECE'`:

- **In Wholesale Mode**:
  $$\text{Unit Price} = \text{variant.wholesalePrice} \parallel \left(\frac{\text{variant.wholesaleCasePrice}}{\text{packSize}}\right) \parallel (\text{variant.retailPrice} \times 0.95)$$
- **In Retail Mode**:
  $$\text{Unit Price} = \text{variant.retailPrice}$$
- **Line Subtotal**:
  $$\text{Line Subtotal} = \text{Unit Price} \times \text{quantity}$$

> The `∥` (fallback) chain guarantees that even a partially configured variant (e.g. missing `wholesaleCasePrice`) always resolves to a sane, non-zero price rather than failing the checkout.

---

## Default Product Catalog & Pricing Table

The preloaded catalog contains 23 products and 46 variants fully configured with market-tested Indian retail and wholesale pricing:

| Category | Product | Variant | MRP (₹) | Retail Price (₹) | Wholesale Piece (₹) | Pack Size | Wholesale Case (₹) |
|---|---|---|---|---|---|---|---|
| **Cool Drinks** | Sprite | 250 ml | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Sprite | 750 ml | ₹40 | ₹40 | ₹34 | 24 bottles | ₹800 |
| | Sprite | 1.25 L | ₹70 | ₹70 | ₹60 | 12 bottles | ₹710 |
| | Sprite | 2.25 L | ₹90 | ₹90 | ₹78 | 6 bottles | ₹460 |
| | Thums Up | 250 ml | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Thums Up | 750 ml | ₹40 | ₹40 | ₹34 | 24 bottles | ₹800 |
| | Thums Up | 1.25 L | ₹70 | ₹70 | ₹60 | 12 bottles | ₹710 |
| | Thums Up | 2.25 L | ₹90 | ₹90 | ₹78 | 6 bottles | ₹460 |
| | Limca | 400 ml | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Fanta | 400 ml | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Campa | Black ₹10 | ₹10 | ₹10 | ₹8.50 | 24 bottles | ₹200 |
| | Campa | Orange ₹10 | ₹10 | ₹10 | ₹8.50 | 24 bottles | ₹200 |
| | Campa | Green ₹10 | ₹10 | ₹10 | ₹8.50 | 24 bottles | ₹200 |
| | Campa | Black ₹20 | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Campa | Orange ₹20 | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Campa | Green ₹20 | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Mountain Dew | Standard | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Fizz | Standard | ₹10 | ₹10 | ₹8.50 | 24 bottles | ₹200 |
| **Water** | Tata Water | 500 ml | ₹10 | ₹10 | ₹8 | 24 bottles | ₹180 |
| | Tata Water | 1 L | ₹20 | ₹20 | ₹15 | 12 bottles | ₹180 |
| | Tata Water | 2 L | ₹30 | ₹30 | ₹24 | 9 bottles | ₹210 |
| | Bisleri | 250 ml | ₹10 | ₹10 | ₹8 | 24 pieces | ₹180 |
| | Clear Water | 250 ml | ₹6 | ₹6 | ₹4.50 | 48 pieces | ₹200 |
| | Woya Water | 500 ml | ₹10 | ₹10 | ₹8 | 24 bottles | ₹180 |
| | Woya Water | 1 L | ₹20 | ₹20 | ₹15 | 12 bottles | ₹180 |
| | Woya Water | 2 L | ₹30 | ₹30 | ₹24 | 9 bottles | ₹210 |
| **Juices** | Frooti | Tetra | ₹10 | ₹10 | ₹8.50 | 50 pieces | ₹420 |
| | Frooti | Pet | ₹10 | ₹10 | ₹8.50 | 40 pieces | ₹340 |
| | Maaza | 250 ml | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Maaza | 1.25 L | ₹75 | ₹75 | ₹65 | 12 bottles | ₹760 |
| | Maaza | 1.5 L | ₹95 | ₹95 | ₹82 | 12 bottles | ₹960 |
| | Maaza Tetra | Tetra | ₹10 | ₹10 | ₹8.50 | 50 pieces | ₹420 |
| | Pulpy Orange | 250 ml | ₹25 | ₹25 | ₹21 | 24 bottles | ₹500 |
| | Pulpy Orange | 1 L | ₹90 | ₹90 | ₹78 | 12 bottles | ₹920 |
| **Milk & Dairy** | Masqati Badam Milk | Glass | ₹40 | ₹40 | ₹35 | 12 glasses | ₹420 |
| | Jersey Badam Milk | ₹20 | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| | Jersey Badam Milk | ₹40 | ₹40 | ₹40 | ₹35 | 24 bottles | ₹820 |
| | Smoodh Chocolate | Standard | ₹10 | ₹10 | ₹8.50 | 24 pieces | ₹200 |
| **Energy Drinks**| Tata Gluco | Standard | ₹10 | ₹10 | ₹8.50 | 24 bottles | ₹200 |
| | Sting | Standard | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| **Soda** | Bindu Zeera Soda | Standard | ₹10 | ₹10 | ₹8.50 | 24 bottles | ₹200 |
| | Real Zeera Soda | Standard | ₹20 | ₹20 | ₹17 | 24 bottles | ₹400 |
| **Health** | ORS | Orange | ₹32 | ₹32 | ₹27 | 24 bottles | ₹640 |
| | ORS | Apple | ₹32 | ₹32 | ₹27 | 24 bottles | ₹640 |

> Run `node src/scripts/update_pricing.js` any time this table changes to sync live MongoDB documents without wiping users, orders, or history.

---

## Database Architecture & Data Models

### 1. `User` Schema

```javascript
{
  fullName: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  customerType: { type: String, enum: ['RETAIL', 'WHOLESALE'], default: 'RETAIL' },
  wholesaleApproved: { type: Boolean, default: false },
  addresses: [{
    fullName: String,
    mobile: String,
    addressLine: String,
    area: String,
    landmark: String,
    pincode: String,
    city: String,
    state: String,
    isDefault: Boolean
  }]
}
```

### 2. `Product` Schema (with Variants)

```javascript
{
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true },
  brand: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  description: String,
  images: [String],
  tags: [String],
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  salesCount: { type: Number, default: 0 },
  variants: [{
    name: { type: String, required: true }, // e.g. "250 ml", "1 L"
    volume: Number,
    unit: String,                           // e.g. "ml", "L", "glass"
    mrp: Number,                            // Maximum Retail Price
    retailPrice: { type: Number, required: true },
    wholesalePrice: Number,                 // Wholesale per-piece rate
    wholesalePackSize: { type: Number, default: 1 }, // Units per case (e.g. 24)
    wholesalePackUnit: { type: String, default: 'bottles' },
    wholesaleCasePrice: Number,             // Cost for 1 full case
    minWholesaleQty: { type: Number, default: 1 },
    allowPieceSaleWholesale: { type: Boolean, default: true },
    stockQuantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    sku: String,
    barcode: String,
    isActive: { type: Boolean, default: true },
    isAvailable: { type: Boolean, default: true }
  }]
}
```

### 3. `Order` Schema

```javascript
{
  orderNumber: { type: String, unique: true }, // e.g. "SB-2026-000004"
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderType: { type: String, enum: ['RETAIL', 'WHOLESALE'], default: 'RETAIL' },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING'
  },
  paymentMethod: { type: String, enum: ['CASH', 'UPI'], default: 'CASH' },
  paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED'], default: 'PENDING' },
  deliveryAddress: {
    fullName: String,
    mobile: String,
    addressLine: String,
    area: String,
    landmark: String,
    pincode: String,
    city: String,
    state: String
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantId: mongoose.Schema.Types.ObjectId,
    productName: String,
    variantName: String,
    sellingUnit: { type: String, enum: ['PIECE', 'CASE'], default: 'PIECE' },
    casesOrdered: { type: Number, default: 0 },
    quantity: Number,       // Total individual units (pieces)
    packSize: Number,       // Pack size if case
    packUnit: String,
    unitPrice: Number,      // Effective unit price
    subtotal: Number,
    orderMode: { type: String, enum: ['RETAIL', 'WHOLESALE'] }
  }],
  subtotal: Number,
  deliveryCharge: Number,
  totalAmount: Number,
  customerNotes: String,
  adminNotes: String,
  idempotencyKey: String,
  timeline: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }]
}
```

### 4. `InventoryTransaction` Schema

```javascript
{
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: {
    type: String,
    enum: ['SALE', 'RESTOCK', 'ADJUSTMENT', 'RETURN', 'DAMAGE', 'CORRECTION'],
    required: true
  },
  quantity: { type: Number, required: true }, // Positive for additions, negative for sales
  previousStock: Number,
  newStock: Number,
  referenceId: String,                       // Order number or adjustment memo
  note: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}
```

### 5. `ShopSettings` Schema

```javascript
{
  shopName: { type: String, default: 'Sri Balaji Cool Drinks & General Store' },
  phoneNumber: String,
  whatsappNumber: String,
  email: String,
  openingTime: { type: String, default: '08:00' },
  closingTime: { type: String, default: '22:00' },
  deliveryCharge: { type: Number, default: 20 },
  freeDeliveryThreshold: { type: Number, default: 500 },
  allowCashOrders: { type: Boolean, default: true },
  allowUpiOrders: { type: Boolean, default: true },
  allowWholesaleOrders: { type: Boolean, default: true },
  requireWholesaleApproval: { type: Boolean, default: false },
  deliveryAreas: [String]
}
```

### Entity Relationship Summary

```
User (1) ───< Order (many) ───< Order.items (embedded, references Product/variant)
Product (1) ───< Product.variants (embedded subdocuments)
Product/Variant (1) ───< InventoryTransaction (many, immutable ledger)
User (admin, 1) ───< AuditLog (many)
ShopSettings — singleton document, cached in-process via settingsService
```

---

## REST API Documentation

All responses conform to the standard payload envelope:

```json
// Successful Response
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}

// Error Response
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

### 1. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register customer account (`fullName`, `mobile`, `email`, `password`) |
| `POST` | `/api/auth/login` | Public | Login via mobile/email and password → returns JWT |
| `POST` | `/api/auth/admin/login`| Public | Admin portal authentication (strictly verifies `role: 'admin'`) |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile and delivery addresses |
| `PUT` | `/api/auth/profile` | Authenticated | Update user name, email, or mobile |
| `POST` | `/api/auth/addresses`| Authenticated | Add a new delivery address |
| `PUT` | `/api/auth/addresses/:id`| Authenticated| Edit an existing delivery address |
| `DELETE`| `/api/auth/addresses/:id`| Authenticated| Remove a delivery address |

### 2. Catalog & Products Endpoints (`/api/products`, `/api/categories`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/categories` | Public | List all active product categories |
| `GET` | `/api/products` | Public | Query catalog (`page`, `limit`, `category`, `search`, `brand`, `inStock`, `sortBy`, `order`) |
| `GET` | `/api/products/:id` | Public | Retrieve single product details by MongoDB ID or slug |
| `GET` | `/api/products/featured` | Public | List featured drinks for home showcase |

### 3. Order Endpoints (`/api/orders`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/orders` | Authenticated | Create a new order (accepts mixed retail & wholesale items) |
| `GET` | `/api/orders/my-orders`| Authenticated | List paginated order history for current customer |
| `GET` | `/api/orders/:id` | Authenticated | Get detailed itemized order tracking and timeline |
| `POST` | `/api/orders/:id/cancel`| Authenticated| Cancel pending order & restore stock |

#### Sample Request Body for Mixed Retail + Wholesale Order

```json
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "paymentMethod": "CASH",
  "customerNotes": "Please deliver after 6 PM",
  "idempotencyKey": "cust_123_timestamp_unique",
  "deliveryAddress": {
    "fullName": "Manikanta",
    "mobile": "9876543210",
    "addressLine": "Shop 4, Gandhi Road",
    "area": "Local Market",
    "landmark": "Near Balaji Temple",
    "pincode": "500001",
    "city": "Hyderabad",
    "state": "Telangana"
  },
  "items": [
    {
      "productId": "65f01...prod1",
      "variantId": "65f01...var1",
      "quantity": 2,
      "sellingUnit": "PIECE",
      "orderMode": "RETAIL"
    },
    {
      "productId": "65f01...prod2",
      "variantId": "65f01...var2",
      "quantity": 1,
      "sellingUnit": "CASE",
      "casesOrdered": 1,
      "orderMode": "WHOLESALE"
    }
  ]
}
```

### 4. Admin Management Endpoints (`/api/admin`)

All `/api/admin` routes require an authenticated token where `role === 'admin'`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/dashboard` | Aggregated metrics: today revenue, pending orders, low stock count |
| `GET` | `/api/admin/orders` | Paginated admin order browser with status/type filters and search |
| `GET` | `/api/admin/orders/:id` | Full order inspection view |
| `PUT` | `/api/admin/orders/:id/status` | Advance status (`PENDING` → `CONFIRMED` → `PACKED` → `OUT_FOR_DELIVERY` → `DELIVERED`) |
| `GET` | `/api/admin/inventory` | Complete list of all variants with current stock and alert badges |
| `POST` | `/api/admin/inventory/adjust` | Record stock restock or correction with audit reason |
| `GET` | `/api/admin/inventory/transactions` | Full historical stock ledger |
| `POST` | `/api/admin/products` | Create new product with embedded variants |
| `PUT` | `/api/admin/products/:id` | Update product or variant details and prices |
| `DELETE`| `/api/admin/products/:id` | Deactivate or remove a product |
| `GET` | `/api/admin/customers` | Customer list with lifetime spend and order count |
| `PUT` | `/api/admin/customers/:id/wholesale` | Approve / revoke wholesale customer status |
| `GET` | `/api/admin/reports/sales` | Sales revenue timeline by date range |
| `GET` | `/api/admin/settings` | Retrieve store settings and operational toggles |
| `PUT` | `/api/admin/settings` | Update store settings (delivery fees, store hours, toggles) |

### 5. Health & Utility

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Basic server/DB liveness probe for uptime monitoring |

---

## Environment Variables Reference

### Backend Configuration — `server/.env`

Create a `.env` file in the `server/` directory:

```env
# =================================================================
# SERVER RUNTIME
# =================================================================
PORT=5000
NODE_ENV=development

# =================================================================
# DATABASE (MongoDB Atlas or Local MongoDB)
# =================================================================
# For local MongoDB:
MONGODB_URI=mongodb://127.0.0.1:27017/sri-balaji-store

# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/sri-balaji-store?retryWrites=true&w=majority

# =================================================================
# AUTHENTICATION & SECURITY
# =================================================================
JWT_SECRET=super_secure_random_jwt_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

# =================================================================
# CORS (Frontend URL)
# =================================================================
CLIENT_URL=http://localhost:5173

# =================================================================
# SEED ADMINISTRATOR CREDENTIALS
# =================================================================
SEED_ADMIN_EMAIL=admin@sribalaji.store
SEED_ADMIN_PASSWORD=Admin@123456
SEED_ADMIN_NAME=Store Admin
SEED_ADMIN_MOBILE=9999999999

# =================================================================
# OPTIONAL: CLOUDINARY (For Image Uploads)
# Leave blank if using direct image URLs
# =================================================================
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend Configuration — `client/.env`

Create a `.env` file in the `client/` directory:

```env
# URL pointing to your backend Express API
VITE_API_URL=http://localhost:5000/api
```

> ⚠️ **Never commit real `.env` files.** Both `server/.env` and `client/.env` should be listed in `.gitignore`; only the `.env.example` templates belong in version control.

---

## Installation & Setup Guide

### Prerequisites

- **Node.js**: `v18.0.0` or higher (tested on Node v20 and v24)
- **Package Manager**: `npm` (v9+)
- **Database**: Local MongoDB service running on `localhost:27017` **or** a free [MongoDB Atlas Cluster](https://www.mongodb.com/atlas).

### 1. Clone the Repository

```bash
git clone <repository_url>
cd Shop
```

### 2. Install Dependencies

You can install all dependencies from the root directory with one command:

```bash
npm install
npm run install:all
```

Alternatively, install in each package directory separately:

```bash
# Install Server dependencies
cd server
npm install

# Install Client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

Copy the example files and fill in your own values:

```bash
cp server/.env.example server/.env
# then edit server/.env with your MongoDB URI, JWT secret, and admin credentials

echo "VITE_API_URL=http://localhost:5000/api" > client/.env
```

---

## Seeding & Database Utilities

The backend contains dedicated scripts to initialize and maintain data:

### 1. Seed the Complete Catalog & Admin Account

```bash
cd server
npm run seed
```

This script:
- Clears and rebuilds the 10 core categories.
- Inserts all **23 products with 46 variants** including volume, unit, retail price, wholesale pack size, and wholesale case pricing.
- Initializes default `ShopSettings` (with `allowWholesaleOrders: true` and `requireWholesaleApproval: false`).
- Creates the default Administrator account using your `SEED_ADMIN_*` environment variables.

### 2. Update Pricing Sync Utility

If you want to refresh or sync catalog prices without wiping users or existing orders:

```bash
cd server
node src/scripts/update_pricing.js
```

### 3. Wholesale Setting Sync

To verify or ensure wholesale mode is open to all customers:

```bash
cd server
node src/scripts/setWholesaleSetting.js
```

---

## Running the Application

### Development Mode (Concurrent)

From the project root:

```bash
npm run dev
```

This runs both the Express API and Vite React client simultaneously.

### Development Mode (Separate Terminals)

**Terminal 1 — Backend Express Server:**

```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 — Frontend React Client:**

```bash
cd client
npm run dev
# Vite runs on http://localhost:5173
```

### Accessing the Applications

- **Customer Web Store**: [http://localhost:5173](http://localhost:5173)
- **Admin Control Center**: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)
- **Backend Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Default Admin Login Credentials

- **Email**: `admin@sribalaji.store` (or the value of `SEED_ADMIN_EMAIL`)
- **Password**: `Admin@123456` (or the value of `SEED_ADMIN_PASSWORD`)

> 🔐 Change the default admin password immediately after your first login on any environment beyond local development.

---

## Testing & Verification

### 1. Automated Order & Pricing Resolution Test

To test the dynamic pricing engine and stock deduction without touching the UI:

```bash
cd server
node src/scripts/test_create_order.js
```

Expected output:
- Resolves Retail piece (Sprite 250ml) and Wholesale case (Tata Water 1L).
- Verifies stock check and accurately reduces inventory.
- Creates Order `SB-YYYY-XXXXXX`.
- Restores stock and cleans up test records.

### 2. Order Flow Resolution Script

```bash
cd server
node src/scripts/test_order_flow.js
```

Runs the pricing-resolution logic against a range of piece and case combinations to confirm the fallback chains in the Pricing & Pack Calculation Engine behave as documented.

### 3. Frontend Production Build Verification

To ensure all JSX, Tailwind styles, and PWA assets compile cleanly:

```bash
cd client
npm run build
```

This outputs production-optimized, minified files into `client/dist/`.

### 4. Manual Smoke-Test Checklist

- [ ] Register a new customer and confirm JWT is issued.
- [ ] Add a retail item and a wholesale case to the same cart, then checkout.
- [ ] Confirm stock is deducted correctly on the admin Inventory page.
- [ ] Advance an order through every status and confirm the customer sees timeline updates.
- [ ] Restock an item from the admin panel and verify the InventoryTransaction ledger entry.

---

## Production Deployment Guide

### Recommended Cloud Stack

| Component | Provider | Notes |
|---|---|---|
| **Frontend** | [Vercel](https://vercel.com) / [Netlify](https://netlify.com) / Cloudflare Pages | Host the static build from `client/dist` |
| **Backend** | [Render](https://render.com) / [Railway](https://railway.app) / AWS EC2 | Run `node server.js` |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/atlas) | M0/M10 Cluster with Replica Set enabled |

### 1. Frontend (Vercel / Static Host)

When deploying a single-page React app with React Router, configure rewrite rules so all deep links route to `index.html`.

Create `client/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Set the environment variable in Vercel:

```
VITE_API_URL=https://your-backend-domain.onrender.com/api
```

### 2. Backend (Render / Railway)

1. Set the root directory to `server/`.
2. Build command: `npm install`
3. Start command: `node server.js`
4. Configure all environment variables from `server/.env.example`:
   - `NODE_ENV=production`
   - `MONGODB_URI=<your_mongodb_atlas_connection_string>`
   - `JWT_SECRET=<strong_production_secret>`
   - `CLIENT_URL=https://your-frontend-app.vercel.app`

### 3. Post-Deployment Checklist

- [ ] Run `npm run seed` once against the production database (or migrate existing data).
- [ ] Confirm CORS only allows the deployed `CLIENT_URL`, not `*`.
- [ ] Verify `/api/health` responds `200` from the public backend URL.
- [ ] Enable MongoDB Atlas IP allow-listing or VPC peering for the backend host.
- [ ] Set up uptime monitoring (e.g. UptimeRobot, Better Stack) against `/api/health`.
- [ ] Rotate `JWT_SECRET` and the seed admin password away from any development values.

---

## Security & Data Integrity

1. **Server-Side Price Authority**: Clients cannot submit item prices or subtotals. The backend loads each variant from MongoDB, verifies available stock, evaluates whether piece or case pricing applies, and recalculates line items and totals.
2. **Sanitized Input**: Protects against NoSQL injection using `express-mongo-sanitize`, plus payload validation middleware on every mutating route.
3. **Stand-Alone & Replica-Set Resilient**: [`server/src/utils/helpers.js`](file:///c:/Users/manik/OneDrive/Desktop/Shop/server/src/utils/helpers.js) automatically detects whether MongoDB is running as a single-node standalone instance or a replica set, executing atomic transactions when available and safe fallbacks otherwise.
4. **Idempotency Protection**: Orders accept an `idempotencyKey` parameter from the client to prevent double charges or duplicate orders caused by slow networks or rapid button clicks.
5. **Secure Authentication**: Passwords hashed with `bcryptjs` using a salt work factor of 12. JWT tokens are verified on all non-public routes.
6. **Rate Limiting**: `express-rate-limit` throttles authentication and order-placement endpoints to blunt brute-force and scripted abuse.
7. **Security Headers**: `Helmet` sets sane defaults (CSP, no-sniff, frameguard, etc.) on every response.
8. **Audit Logging**: Sensitive admin actions (price changes, order status overrides, wholesale approvals) are recorded in `AuditLog` for traceability.

---

## Performance & Scalability Notes

- **Indexed Lookups**: `User.mobile`, `User.email`, `Product.slug`, and `Order.orderNumber` are unique-indexed for fast auth and order lookups.
- **Cached Settings**: `settingsService` caches the singleton `ShopSettings` document in-process, avoiding a database round-trip on every request that needs delivery fees or store hours.
- **Pagination Everywhere**: Catalog, order history, and admin list endpoints all accept `page`/`limit` to keep response payloads small as data grows.
- **PWA Caching**: Static assets and recently viewed catalog pages are precached by the service worker, keeping repeat visits fast even on patchy mobile networks.
- **Horizontal Scaling Path**: Because pricing and stock checks are fully server-authoritative and stateless per-request (aside from the MongoDB transaction), the Express API can be scaled horizontally behind a load balancer once traffic warrants it.

---

## Roadmap

- [ ] SMS/WhatsApp order status notifications via a provider like Twilio or Gupshup.
- [ ] Barcode scanning in the admin Inventory page for faster stock corrections.
- [ ] Customer-facing loyalty points for repeat wholesale buyers.
- [ ] Exportable CSV/PDF sales reports from the admin Reports page.
- [ ] Multi-store support (in case additional branches open).

---

## Contributing

This is currently private, single-team software, but the following workflow keeps things consistent if collaborators join:

1. Branch from `main` using `feature/<short-description>` or `fix/<short-description>`.
2. Keep controllers thin — business logic belongs in `services/`, not inline in route handlers.
3. Any change to `Product.variants` pricing fields must be reflected in `update_pricing.js` and this README's catalog table.
4. Run `npm run build` (client) before opening a PR to catch compile-time issues early.
5. Include before/after screenshots for any UI-affecting change.

---

## Troubleshooting & FAQ

### Q: Why was Add to Cart disabled in Wholesale mode?
**A:** Ensure all product variants have either `wholesaleCasePrice` or `wholesalePrice` set, or have `retailPrice` populated so the fallback algorithm can compute the case price. Run `node src/scripts/update_pricing.js` in `server/` to ensure all database records are populated.

### Q: I get `403 Forbidden: Wholesale account approval required`. How do I enable wholesale for all users?
**A:** Run `node src/scripts/setWholesaleSetting.js` in `server/`. This sets `requireWholesaleApproval: false` in `ShopSettings`, enabling instant wholesale ordering for all customers.

### Q: Does switching between Retail and Wholesale clear the user's cart?
**A:** No. The platform supports mixed carts. A customer can switch back and forth between modes to add single bottles and full cases into one order.

### Q: "Transaction numbers are only allowed on a replica set member or mongos"
**A:** Standalone local MongoDB installations do not support multi-document transactions. The helper function `runWithOptionalTransaction` in `server/src/utils/helpers.js` auto-detects this and gracefully falls back to non-transactional execution without throwing errors.

### Q: My admin login keeps failing even with the right email/password.
**A:** Confirm the account's `role` field is actually `'admin'` — `/api/auth/admin/login` strictly rejects any account where `role !== 'admin'`, even with correct credentials. Re-run `npm run seed` in a clean environment if the admin account was accidentally deleted or demoted.

### Q: Orders are stuck at `PENDING` and stock never deducts.
**A:** Check the server logs for a MongoDB connection or transaction error. On a standalone (non-replica-set) MongoDB instance, this should already be handled by the fallback in `helpers.js` — if it isn't, confirm your MongoDB version supports the driver version pinned in `server/package.json`.

### Q: How do I reset the demo/seed data without affecting real customer orders?
**A:** `npm run seed` clears and rebuilds categories, products/variants, and the admin account — it does **not** touch `Order`, `User` (non-admin), or `InventoryTransaction` collections. Use `update_pricing.js` instead if you only need to sync prices.

---

## License

Private software developed for **Sri Balaji Cool Drinks & General Store**. All rights reserved.
