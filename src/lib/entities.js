// src/lib/entities.js
// تعريف المستودعات لكل كيان في النظام، مربوطة بأسماء الإجراءات (actions) في Google Apps Script
import { createRepo } from './repo.js'

export const productsRepo = createRepo('products', {
  list: 'getProducts',
  create: 'createProduct',
  update: 'updateProduct',
  remove: 'deleteProduct'
})

export const customersRepo = createRepo('customers', {
  list: 'getCustomers',
  create: 'createCustomer',
  update: 'updateCustomer',
  remove: 'deleteCustomer'
})

export const suppliersRepo = createRepo('suppliers', {
  list: 'getSuppliers',
  create: 'createSupplier',
  update: 'updateSupplier',
  remove: 'deleteSupplier'
})

export const salesInvoicesRepo = createRepo('salesInvoices', {
  list: 'getSalesInvoices',
  create: 'createSalesInvoice',
  update: 'updateSalesInvoice',
  remove: 'deleteSalesInvoice'
})

export const purchaseInvoicesRepo = createRepo('purchaseInvoices', {
  list: 'getPurchaseInvoices',
  create: 'createPurchaseInvoice',
  update: 'updatePurchaseInvoice',
  remove: 'deletePurchaseInvoice'
})

export const expensesRepo = createRepo('expenses', {
  list: 'getExpenses',
  create: 'createExpense',
  update: 'updateExpense',
  remove: 'deleteExpense'
})
