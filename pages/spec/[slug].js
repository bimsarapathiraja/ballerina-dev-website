import fs from 'fs';
import matter from 'gray-matter';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Container, Col, Row } from 'react-bootstrap';
import remarkGfm from 'remark-gfm';
import Image from 'next-image-export-optimizer';
import rehypeRaw from 'rehype-raw';
import Head from 'next/head';
import Link from 'next/link';


import { getHighlighter, setCDN } from "shiki";

setCDN("https://unpkg.com/shiki/");


import Layout from '../../layouts/LayoutSpec';
import { prefix } from '../../utils/prefix';



var traverseFolder = function (dir) {
  var results = [];
  var list = fs.readdirSync(dir);
  list.forEach(function (file) {

    var filex = dir + "/" + file;
    var stat = fs.statSync(filex);

    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      if (!file.match(/^_/)) {
        results = results.concat(traverseFolder(filex));
      }
    } else {
      /* Is a file */
      if (filex !== 'spec/spec.md') {
        filex = filex.replace(/spec\//g, "");
        results.push(filex);
      }
    }

  });
  return results;
};

export async function getStaticPaths() {
  // Retrieve all our slugs
  const files = traverseFolder("spec");
  const paths = files.map((fileName) => ({
    params: {
      slug: fileName.replace("\/spec.md", ""),
    },
  }));

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params: { slug } }) {

  // slug = slug.join("/");
  const fileName = fs.readFileSync(`spec/${slug}/spec.md`, "utf-8");
  const { data: frontmatter, content } = matter(fileName);

  return {
    props: {
      frontmatter,
      content
    },
  };
}


export default function PostPage({ frontmatter, content }) {

  const HighlightSyntax = (code, language) => {
    const [codeSnippet, setCodeSnippet] = React.useState([]);
    if (language == 'proto') {
      language = 'ballerina';
    }
    React.useEffect(() => {

      async function fetchData() {
        getHighlighter({
          theme: "github-light",
          langs: ['bash', 'ballerina', 'toml', 'yaml', 'sh', 'json', 'graphql', 'sql']
        }).then((highlighter) => {
          setCodeSnippet(highlighter.codeToHtml(code, language));
        })
      }
      fetchData();
    }, [code, language]);

    return [codeSnippet]
  }


  // Add id attributes to headings
  const extractText = (value) => {
    if (typeof value === 'string') {
      return value
    } else {
      return value.props.children
    }
  }

  const genrateId = (children) => {
    const newArray = children.map(extractText);
    let newId = newArray.join('').replace(/[&\/\\#,+()!$~%.'":*?<>{}]/g, '').toLowerCase();
    newId = newId.replace(/ /g, '-');

    return newId;
  }

  return (
    <>
      <Head>
        <meta name="description" content={frontmatter.description} />
        <meta name="keywords" content={frontmatter.keywords} />

        <title>{frontmatter.title}</title>

        {/* <!--FB--> */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={`Ballerina - ${frontmatter.title}`} />
        <meta property="og:description" content={frontmatter.description}></meta>

        {/* <!--LINKED IN  --> */}
        <meta property="og:description" content={frontmatter.description} />

        {/* <!--TWITTER--> */}
        <meta property="twitter:description" content={frontmatter.description} />
        <meta property="twitter:text:description" content={frontmatter.description} />



      </Head>
      <Layout>
        <Col xs={12} className='mdContent'>
          <Container>
            <Row className='topRowSpec'>
              <Col xs={12}>
                <Link href='/' passHref className='specIcon'><Image src={`${prefix}/images/ballerina-logo.svg`} height={37} width={199} alt="Ballerina-logo" className='specIcon' /></Link>
              </Col>
            </Row>

            <Row className='specContent'>
              <ReactMarkdown className='stdLib'
                components={{
                  h2: ({ node, children, ...props }) => <h2 id={genrateId(children)} {...props}>{children}</h2>,
                  h3: ({ node, children, ...props }) => <h3 id={genrateId(children)} {...props}>{children}</h3>,
                  h4: ({ node, children, ...props }) => <h4 id={genrateId(children)} {...props}>{children}</h4>,
                  h5: ({ node, children, ...props }) => <h5 id={genrateId(children)} {...props}>{children}</h5>,
                  h6: ({ node, children, ...props }) => <h6 id={genrateId(children)} {...props}>{children}</h6>,
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    return inline ?
                      <code className={className} {...props}>
                        {children}
                      </code>
                      : match ?
                        <div dangerouslySetInnerHTML={{ __html: HighlightSyntax(String(children).replace(/\n$/, ''), match[1].toLowerCase()) }} />
                        : <pre className='default'>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                  }
                }}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {content}
              </ReactMarkdown>

            </Row>
          </Container>
        </Col>

      </Layout>
    </>
  );
}