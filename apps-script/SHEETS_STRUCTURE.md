# هيكل Google Sheet — EdaraERP

يتم إنشاء كل هذه الأوراق تلقائيًا عند تشغيل دالة `setupSheets()` من ملف `apps-script/SheetsSetup.gs`.
لا حاجة لإنشائها يدويًا.

| الورقة | الأعمدة |
|---|---|
| **Products** | Id, Name, Barcode, BaseUnit, StockQty, ReorderLevel, ExpiryDate, ExpiryAlertDays, Units (JSON), BuyPrice, ImageUrl, CreatedAt, UpdatedAt |
| **Customers** | Id, Name, Phone, Address, Balance, CreditLimit, LastInvoiceDate, CreatedAt |
| **Suppliers** | Id, Name, Phone, Address, Balance, CreditLimit, LastInvoiceDate, CreatedAt |
| **SalesInvoices** | Id, InvoiceNumber, PartyId, PartyName, Date, TotalAmount, PreviousBalance, CurrentBalance, IsCredit, CreatedBy, CreatedAt |
| **SalesInvoiceItems** | Id, InvoiceId, ProductId, ProductName, UnitName, UnitFactor, Qty, Price, Total |
| **PurchaseInvoices** | Id, InvoiceNumber, PartyId, PartyName, Date, TotalAmount, PreviousBalance, CurrentBalance, IsCredit, CreatedBy, CreatedAt |
| **PurchaseInvoiceItems** | Id, InvoiceId, ProductId, ProductName, UnitName, UnitFactor, Qty, Price, Total |
| **Expenses** | Id, Category, Amount, Date, Notes, CreatedBy, CreatedAt |
| **Users** | Email, Name, Phone, Active, Role, Permissions (JSON), CreatedAt |
| **AuditLog** | Timestamp, UserEmail, UserName, ActionType, EntityType, EntityId, Details, Status |
| **Backups** | Timestamp, FileName, FileUrl, FileSizeMB, Status, ErrorDetails |
| **StockAlerts** | ProductId, ProductName, AlertType, Details, CreatedAt, Resolved |
| **CustomerLedger** | Id, CustomerId, Date, Type, Amount, BalanceAfter, RefInvoiceId |
| **SupplierLedger** | Id, SupplierId, Date, Type, Amount, BalanceAfter, RefInvoiceId |
| **ProductUnits** | Id, ProductId, UnitName, Factor, SellPrice *(ملاحظة: التطبيق الحالي يخزّن الوحدات داخل عمود `Units` بصيغة JSON مباشرة في شيت Products لتبسيط القراءة/الكتابة؛ هذه الورقة احتياطية لمن يفضّل التطبيع الكامل Normalized)* |
| **PushSubscriptions** | UserEmail, Endpoint, Keys (JSON), CreatedAt |
| **Settings** | Key, Value *(تحتوي على AdminEmail و CompanyName كحد أدنى)* |

## ملاحظات مهمة

- عمود **Permissions** في شيت Users يُخزَّن كنص JSON بالشكل:
  ```json
  { "sales": "full", "purchases": "view", "products": "edit" }
  ```
  المستويات الممكنة: `view` (عرض فقط) ، `edit` (تعديل) ، `delete` (حذف) ، `full` (إدارة كاملة).

- عمود **Units** في شيت Products يُخزَّن كنص JSON بالشكل:
  ```json
  [{ "unitName": "قطعة", "factor": 1, "sellPrice": 10 }, { "unitName": "كرتونة", "factor": 12, "sellPrice": 110 }]
  ```

- المستخدم الأول بدور `admin` يُضاف تلقائيًا بالبريد `admin@example.com` — **يجب تعديله فورًا** من الشيت مباشرة إلى بريدك الحقيقي بعد النشر.
