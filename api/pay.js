export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://mustashari.net');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { amount, currency, customer, source } = req.body;

  if (!amount || !source) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch('https://api.tap.company/v2/charges', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.TAB_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: currency || 'SAR',
        customer_initiated: true,
        threeDSecure: true,
        save_card: false,
        description: 'استشارة قانونية - مستشاري',
        source: { id: source },
        customer: {
          first_name: customer?.name || 'عميل',
          phone: {
            country_code: '966',
            number: (customer?.phone || '').replace(/^0/, '')
          }
        },
        redirect: { url: 'https://mustashari.net' },
        post: { url: 'https://mustashari.net/api/webhook' },
      })
    });

    const data = await response.json();

    if (data.status === 'INITIATED' || data.status === 'CAPTURED') {
      return res.status(200).json({ success: true, charge: data });
    } else {
      return res.status(400).json({ success: false, error: data.errors?.[0]?.description || 'فشل الدفع' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: 'حدث خطأ في الاتصال' });
  }
}
