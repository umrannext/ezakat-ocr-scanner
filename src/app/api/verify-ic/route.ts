import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { icNumber } = await request.json();

    // Mock API Delay (menyelakulasikan masa menunggu API luaran)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock validation logic
    if (!icNumber || icNumber.length < 7) {
      return NextResponse.json({ success: false, message: 'Format Kad Pintar Tidak Sah' }, { status: 400 });
    }

    // Mock response: Kembalikan nama yang disahkan.
    // Dalam dunia sebenar, ini akan memanggil API Kerajaan Brunei.
    return NextResponse.json({
      success: true,
      data: {
        icNumber,
        verifiedName: "AWANG MUHAMMAD UMAR BIN ABDULLAH", // Data olok-olok (Mock Data)
        status: "VERIFIED"
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Ralat Pelayan Internal' }, { status: 500 });
  }
}
