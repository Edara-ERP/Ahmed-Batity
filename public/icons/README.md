# أيقونات PWA المطلوبة

ضع هنا ملفي الأيقونة بصيغة PNG بالأحجام التالية (مطلوبة لعمل الـ Web App Manifest):

- icon-192.png  → 192×192 بكسل
- icon-512.png  → 512×512 بكسل

يفضّل أن تكون الأيقونة بخلفية اللون الأساسي Teal (#0d7377) وحرف "E" أو شعار الشركة بخط أبيض،
بنفس روح ملف public/favicon.svg الموجود في هذا المشروع.

يمكنك توليدها بسهولة من favicon.svg باستخدام أي أداة تحويل SVG → PNG (مثل https://cloudconvert.com)
أو عبر الأمر التالي إن توفر لديك Node:

npx sharp-cli -i ../favicon.svg -o icon-192.png resize 192 192
npx sharp-cli -i ../favicon.svg -o icon-512.png resize 512 512
