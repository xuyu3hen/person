import { EarthBackground } from '@/components/ui/EarthBackground';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MoveRight, Globe, Satellite, Server } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Earth Observations | NASA Background Interface',
  description: 'High-resolution Earth observation data powered by NASA Open APIs.',
};

// Next.js ISR (Incremental Static Regeneration), 每天重新获取一张不同的图片 (每天86400秒)
export const revalidate = 86400;

async function fetchNasaEarthImage() {
  try {
    // 调用 NASA 图片 API，搜索带有“blue marble”高清晰度地球全景图
    const res = await fetch(
      'https://images-api.nasa.gov/search?q=earth%20from%20space&media_type=image'
    );
    if (!res.ok) throw new Error('Failed to fetch from NASA API');

    const data = await res.json();
    const items = data.collection?.items || [];
    
    // 过滤出含有地球图像的有效条目 (尽量避免包含“award”等无关人物照片)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validItems = items.filter((item: any) => {
      const title = item.data[0]?.title?.toLowerCase() || '';
      const desc = item.data[0]?.description?.toLowerCase() || '';
      return !title.includes('award') && (title.includes('earth') || desc.includes('earth'));
    });

    if (validItems.length > 0) {
      // 获取当天的随机图，或者直接选第一张。这里取前10个结果中的一个伪随机项。
      const randomIdx = Math.floor(Math.random() * Math.min(validItems.length, 10));
      const targetItem = validItems[randomIdx];
      
      // 取高清（~large）或者原图（~orig）的URL。这里为了响应式和性能，NASA通常提供 ~orig, ~large, ~medium 等后缀。
      // 因为原图可能高达几十MB，所以我们把 ~orig.jpg 替换为 ~large.jpg 或直接使用返回的 collection.json 获取
      // 更稳定的做法是直接拼接 `~large.jpg` 以防原图过大导致内存/带宽耗尽。
      const nasaId = targetItem.data[0].nasa_id;
      const imageUrl = `https://images-assets.nasa.gov/image/${nasaId}/${nasaId}~large.jpg`;
      
      return {
        imageUrl,
        title: targetItem.data[0].title,
        description: targetItem.data[0].description,
      };
    }
  } catch (error) {
    console.error('NASA API Error:', error);
  }

  // Fallback image in case the API fails (A famous NASA Blue Marble Image ID)
  return {
    imageUrl: 'https://images-assets.nasa.gov/image/PIA18033/PIA18033~large.jpg',
    title: 'Earth - Blue Marble',
    description: 'A classic view of Earth from space.',
  };
}

export default async function EarthPage() {
  const { imageUrl, title, description } = await fetchNasaEarthImage();

  return (
    <EarthBackground imageUrl={imageUrl} altText={title}>
      <header className="flex items-center justify-between p-6 md:px-12 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <Globe className="w-6 h-6 text-white/90" />
          <span className="font-medium text-lg tracking-tight text-white/90">Earth.</span>
        </div>
        <nav>
          <Link href="/">
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10">
              Return Home
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col justify-center items-start p-6 md:px-12 w-full max-w-7xl mx-auto">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-white/90 uppercase tracking-wider">Live NASA Feed</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white drop-shadow-lg leading-tight">
            Explore Our <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Home Planet
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 leading-relaxed drop-shadow-md max-w-xl">
            {title}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <Button className="bg-white text-black hover:bg-white/90 font-medium">
              Start Exploring <MoveRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm">
              View Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24 mb-12">
          <Card className="!bg-black/40 !border-white/10 backdrop-blur-md text-white">
            <div className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Satellite className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold">High Resolution</h3>
              <p className="text-white/60 text-sm">
                Optimized images loaded dynamically from the official NASA image library. Supported by Next.js advanced image optimization.
              </p>
            </div>
          </Card>

          <Card className="!bg-black/40 !border-white/10 backdrop-blur-md text-white">
            <div className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold">Responsive Layout</h3>
              <p className="text-white/60 text-sm">
                Perfectly fits any screen size. Utilizing Framer Motion for smooth scale and opacity transitions upon loading.
              </p>
            </div>
          </Card>

          <Card className="!bg-black/40 !border-white/10 backdrop-blur-md text-white">
            <div className="p-6 space-y-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">Edge Compatible</h3>
              <p className="text-white/60 text-sm">
                Server-side data fetching ensures zero layout shift. Fallback states are gracefully handled with CSS gradients.
              </p>
            </div>
          </Card>
        </div>
      </main>

      <footer className="w-full p-6 text-center border-t border-white/10 bg-black/20 backdrop-blur-sm">
        <p className="text-xs text-white/50">
          Image Courtesy of NASA Image and Video Library. Educational purpose only.
        </p>
      </footer>
    </EarthBackground>
  );
}
