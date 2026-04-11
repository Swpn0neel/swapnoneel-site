async function fetchHashnodePosts() {
  const query = `
    query Publication {
      publication(host: "swapnoneel.hashnode.dev") {
        posts(first: 10) {
          edges {
            node {
              title
              slug
              publishedAt
              coverImage { url }
            }
          }
        }
      }
    }
  `;

  const endpoint =
    process.env.HASHNODE_GQL_ENDPOINT || "https://gql.hashnode.com/";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const body = await response.json();
  const posts = body.data.publication.posts.edges.map((e) => e.node);
  console.log(JSON.stringify(posts, null, 2));
}

fetchHashnodePosts();
