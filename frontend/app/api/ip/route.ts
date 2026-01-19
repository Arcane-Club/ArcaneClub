import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('http://whois.pconline.com.cn/ipJson.jsp?json=true');
    const arrayBuffer = await res.arrayBuffer();
    const decoder = new TextDecoder('gbk');
    const text = decoder.decode(arrayBuffer);
    
    // Extract JSON from the response text
    // The response is usually like: if(window.IPCallBack) {IPCallBack({"ip":"...","pro":"...","city":"..."});}
    // Or just {"ip":"...","pro":"..."} depending on params.
    // ?json=true usually returns just the JSON object but sometimes with whitespace.
    // Actually ?json=true on pconline returns:
    // {
    //    "ip": "...",
    //    ...
    // }
    // Let's parse it safely.
    
    // Find the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    
    if (start !== -1 && end !== -1) {
      const jsonStr = text.substring(start, end + 1);
      const data = JSON.parse(jsonStr);
      return NextResponse.json(data);
    }
    
    return NextResponse.json({ error: 'Failed to parse IP data' }, { status: 500 });
  } catch (error) {
    console.error('IP fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch IP data' }, { status: 500 });
  }
}
