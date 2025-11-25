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

    // Trong Docker, Next.js API route (server-side) cần kết nối đến backend service
    // Sử dụng tên service 'backend' thay vì 'localhost' khi chạy trong Docker
    // Ưu tiên biến môi trường BACKEND_INTERNAL_URL (cho server-side) hoặc NEXT_PUBLIC_API_URL
    let backendBaseUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9000/api';
    
    // Nếu đang chạy trong Docker và NEXT_PUBLIC_API_URL chứa localhost, thay bằng tên service
    if (backendBaseUrl.includes('localhost:9000')) {
      backendBaseUrl = backendBaseUrl.replace('localhost:9000', 'backend:9000');
    }
    
    // Đảm bảo URL có /api ở cuối
    if (!backendBaseUrl.endsWith('/api')) {
      backendBaseUrl = backendBaseUrl.replace(/\/api\/?$/, '') + '/api';
    }
    
    const backendUrl = `${backendBaseUrl}/designs/file/${id}`;
    
    console.log('[PDF Proxy] Backend URL:', backendUrl);

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
  } catch (error: any) {
    console.error('[PDF Proxy] Error proxying PDF:', error);
    console.error('[PDF Proxy] Error details:', {
      message: error?.message,
      cause: error?.cause,
      code: error?.code,
      stack: error?.stack,
    });
    
    // Trả về thông báo lỗi chi tiết hơn cho debugging
    const errorMessage = error?.cause?.code === 'ECONNREFUSED' 
      ? 'Không thể kết nối đến backend server. Vui lòng kiểm tra backend có đang chạy không.'
      : error?.message || 'Internal server error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    );
  }
}

