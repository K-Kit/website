import React, { useState } from "react";
import { graphql } from "gatsby";
import Img from "gatsby-image";
import { BLOCKS, INLINES, MARKS } from '@contentful/rich-text-types'
import { documentToReactComponents } from '@contentful/rich-text-react-renderer';
import styled from "styled-components";
import tw from "tailwind.macro";
import Simple from "./simple";
import SEO from "../components/seo";
import Tag from "../components/community/tag";
import SyntaxHighlighter from "../components/syntax-highlighter";
import BackLink from "../components/community/back-link";
import CTALink from "../components/community/cta-link";

import colors from "../colors";

import { ArticlePosted, AuthorCard } from "../components/community/articles";

const BlogContent = styled.div`
  ${tw`mt-8`}
`;

const BlogCode = styled.code`
  ${tw`block whitespace-pre-wrap`}
`;

const BlogHeader = styled.div`
  ${tw`text-center`}
  h1 {
    font-weight: 400;
    font-size: 40px;
    margin-bottom: 2px;
  }
`;

const BlogBody = styled.div`
  ${tw`mt-8`}
  p {
    font-family: "Nunito Sans", Roboto, sans-serif;
    font-size: 16px;
    line-height: 24px;
    font-weight: 400;
    color: #333;
    & img {
      text-align: center;
      margin: 16px auto;
    }
  }
`;

const BlogFooter = styled.div`
  ${tw`justify-between mt-4`}
`;

const IframeContainer = styled.span`
  padding-bottom: 56.25%; 
  position: relative; 
  display: block; 
  width: 100%;

  > iframe {
    height: 100%;
    width: 100%;
    position: absolute; 
    top: 0; 
    left: 0;
  }`;

export const query = graphql`
  query($slug: String!) {
    contentfulPost( slug: { eq: $slug }) {
      title
      authors {
        name
        twitter
        slug
        avatar {
          fixed(height: 60) {
            ...GatsbyContentfulFixed
          }
        }
      }
      content {
        json
      }
      tags {
        id
        name
        slug
      }
      headerImage {
        fixed(cropFocus: CENTER, resizingBehavior: PAD, width: 1200, height: 600) {
          src
        }
        fluid(maxWidth: 1000) {
          ...GatsbyContentfulFluid
        }
      }
      createdAt(formatString: "MMMM Do, YYYY")
      publishDate(formatString: "MMMM Do, YYYY")
      excerpt {
        excerpt
      }
      ctaText
    }
  }
`;

type GraphQLQuery = {
  data: any;
};

const BlogPost: React.FC<GraphQLQuery> = ({ data }) => {
  const post = data.contentfulPost;
  const options = {
    renderMark: {
      [MARKS.CODE]: (text: string) => <BlogCode>{text}</BlogCode>
    },
    renderNode: {
      [BLOCKS.EMBEDDED_ASSET]: (node) => {
        const { title, description, file } = node.data.target.fields;
        const mimeType = file['en-US'].contentType
        const mimeGroup = mimeType.split('/')[0]
  
        switch (mimeGroup) {
          case 'image':
            return <img
              style={{maxWidth:"100%",height:"auto"}}
              title={ title ? title['en-US'] : null}
              alt={description ?  description['en-US'] : null}
              src={file['en-US'].url}
            />
          case 'application':
            return <a
              title={description ?  description['en-US'] : null}
              href={file['en-US'].url}
              >{ title ? title['en-US'] : file['en-US'].details.fileName }
            </a>
          default:
            return <span style={{backgroundColor: 'red', color: 'white'}}> {mimeType} embedded asset </span>
        }
      },
      [BLOCKS.EMBEDDED_ENTRY]: (node) => {
        const entry = node.data.target;
        const entryType = entry.sys.contentType.sys.id

        switch(entryType) {
          case 'codeSnippet':
            {
              const {title, language} = entry.fields;
              const [code, setCode] = useState(entry.fields.code["en-US"]);
              return <SyntaxHighlighter title={title["en-US"]} language={language["en-US"]} code={code} onChange={setCode} />
            }
          default:
            return <span style={{backgroundColor: 'red', color: 'white'}}> {entryType} embedded asset </span>
        }
      },
      [INLINES.HYPERLINK]: (node, children) => {
        if((node.data.uri).includes("player.vimeo.com/video")){
          return <IframeContainer><iframe title={node.content[0].value} src={node.data.uri} frameBorder="0" allowFullScreen></iframe></IframeContainer>
        } else if((node.data.uri).includes("youtube.com/embed")) {
          return <IframeContainer><iframe title={node.content[0].value} src={node.data.uri} allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" frameBorder="0" allowFullScreen></iframe></IframeContainer>
        }
        return <a href={node.data.uri}>{children}</a>
      }
    }
  };

  return (
    <Simple title={post.title} description={post.excerpt.excerpt}>
      <SEO 
        title={post.title} 
        description={post.excerpt.excerpt} 
        image={`https:${post.headerImage.fixed.src}`} 
        meta={[{ name: "twitter:card", content: "summary_large_image" }]} 
      />
      <BackLink />

      <BlogContent>
        <Img fluid={post.headerImage.fluid} style={{ borderRadius: 10 }} />
        <BlogHeader>
          <h1>{post.title}</h1>
          <ArticlePosted
            id={post.authors[0].slug}
            name={post.authors[0].name}
            date={post.publishDate || post.createdAt}
          />
          <div>
            {post.tags.map((tag: {name: string, slug: string}, idx: number) => (
              <span key={`tag-${idx}`} style={{ marginRight: 8 }}>
                <Tag label={tag.name} slug={tag.slug} />
              </span>
            ))}
          </div>
        </BlogHeader>
        <BlogBody>
          { documentToReactComponents(post.content.json, options) }
        </BlogBody>
        <BlogFooter>
          <div 
            style={{
              position: "relative",
              width: "fit-content",
              margin: "auto",
              marginRight: "auto",
              marginTop: "40px",
            }}
          >
            {post.ctaText && <CTALink text={post.ctaText} /> }
          </div>
          <div
            style={{
              display: "flex",
              paddingTop: 24
            }}
          >
            <div
              style={{
                borderTop: `1px solid ${colors.lightGray}`,
                paddingTop: 16,
                marginRight: "auto"
              }}
            >
              <AuthorCard
                id={post.authors[0].slug}
                name={post.authors[0].name}
                avatar={post.authors[0].avatar.fixed}
              />
            </div>
            
            <div
              style={{
                marginLeft: "auto",
                paddingTop: 26
              }}
            >
              <BackLink />
            </div>
          </div>
        </BlogFooter>
      </BlogContent>
    </Simple>
  );
};

export default BlogPost;
