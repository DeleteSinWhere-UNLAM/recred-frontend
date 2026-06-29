export function getCloudinaryPublicId(url: string): string {
  const fallback = 'logo_sin_fondo_ikciro';
  if (!url) return fallback;
  if (!url.includes('res.cloudinary.com/')) {
    return fallback;
  }
  try {
    const parts = url.split('/image/upload/');
    if (parts.length < 2) return fallback;
    
    // Get everything after '/image/upload/'
    let path = parts[1];
    
    // Strip the format extension (e.g. .png, .jpg)
    const dotIndex = path.lastIndexOf('.');
    if (dotIndex !== -1) {
      path = path.substring(0, dotIndex);
    }
    
    // Strip version number (e.g. v12345678/)
    path = path.replace(/^v\d+\//, '');
    
    // Replace slashes with colons for Cloudinary overlay format
    return path.replace(/\//g, ':');
  } catch (e) {
    return fallback;
  }
}

export function buildCloudinaryCollageUrl(imageUrls: (string | null | undefined)[]): string {
  const fallbackImage = 'https://res.cloudinary.com/djzfudbze/image/upload/v1781748941/logo_sin_fondo_ikciro.png';
  
  if (!imageUrls || imageUrls.length === 0) {
    return fallbackImage;
  }

  // Filter out invalid/empty image URLs and normalize them
  const cleanUrls = imageUrls.map(url => (url && url.length > 2) ? url : fallbackImage);

  // If there's only 1 product, return its image directly
  if (cleanUrls.length === 1) {
    return cleanUrls[0];
  }

  // Base canvas URL (using logo_sin_fondo_ikciro colorized to a light slate color as background)
  const cloudName = 'djzfudbze';
  const baseImgPublicId = 'logo_sin_fondo_ikciro';
  const baseUrl = `https://res.cloudinary.com/${cloudName}/image/upload`;

  // Base canvas transformation: resize base image to 800x600 and colorize it to #f1f5f9
  const baseTransform = 'w_800,h_600,c_fill,e_colorize,co_rgb:f1f5f9';

  // Get public IDs of the images (up to 4)
  const ids = cleanUrls.slice(0, 4).map(url => getCloudinaryPublicId(url));
  const count = ids.length;

  let transformations = '';

  if (count === 2) {
    // 2 products: split left-right with 4px gap in middle (x=398 to x=402)
    transformations = `l_${ids[0]},c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_0,y_0` +
                     `/l_${ids[1]},c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_402,y_0`;
  } else if (count === 3) {
    // 3 products: left column 398x600, right split into two 398x298 with 4px gap
    transformations = `l_${ids[0]},c_fill,w_398,h_600/fl_layer_apply,g_north_west,x_0,y_0` +
                     `/l_${ids[1]},c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_0` +
                     `/l_${ids[2]},c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_302`;
  } else {
    // 4 or more products: 2x2 grid of 398x298 with 4px gap
    transformations = `l_${ids[0]},c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_0,y_0` +
                     `/l_${ids[1]},c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_0` +
                     `/l_${ids[2]},c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_0,y_302` +
                     `/l_${ids[3]},c_fill,w_398,h_298/fl_layer_apply,g_north_west,x_402,y_302`;
  }

  return `${baseUrl}/${baseTransform}/${transformations}/${baseImgPublicId}.png`;
}
