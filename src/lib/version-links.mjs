/** Resolve documentation links against this build's base, including MDX links. */
export default function versionLinks({ base }) {
  const resolve = (url) => typeof url === 'string' && url.startsWith('/') && !url.startsWith('//')
    ? `${base}/${url.slice(1)}` : url;

  return (tree) => {
    function visit(node) {
      if (node.type === 'link' || node.type === 'image' || node.type === 'definition') {
        node.url = resolve(node.url);
      }
      if (node.type === 'html') {
        node.value = node.value.replace(/\b(href|src)=(['"])(\/.*?)\2/g,
          (_, attr, quote, url) => `${attr}=${quote}${resolve(url)}${quote}`);
      }
      for (const attr of node.attributes || []) {
        if (attr.name === 'href' || attr.name === 'src') attr.value = resolve(attr.value);
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
