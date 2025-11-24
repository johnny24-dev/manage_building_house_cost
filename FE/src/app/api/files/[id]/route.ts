import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route để proxy PDF file từ backend
 * Token được lấy từ cookie hoặc header, không hiển thị trong URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Lấy token từ cookie (ưu tiên) hoặc từ Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
    const backendUrl = `${API_URL}/designs/file/${id}`;

    // Fetch PDF từ backend với token trong header
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch PDF' },
        { status: response.status }
      );
    }

    // Get PDF data
    const pdfBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/pdf';
    const contentDisposition = response.headers.get('content-disposition');

    // Return PDF với headers phù hợp để browser hiển thị
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition || `inline; filename="file.pdf"`,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

