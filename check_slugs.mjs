async function f(){
  const q = `query Publication {
    publication(host: "swapnoneel.hashnode.dev") {
      posts(first: 50) {
        edges {
          node {
            slug
          }
        }
      }
    }
  }`;
  const r = await fetch('https://gql.hashnode.com/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: q })
  });
  const b = await r.json();
  const slugs = b.data.publication.posts.edges.map(e => e.node.slug);
  console.log(slugs);
}
f();
