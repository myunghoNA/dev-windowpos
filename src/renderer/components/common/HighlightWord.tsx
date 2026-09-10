import React from 'react';

interface HighlightWordProps {
    text: string
    keyword: any
    searchType: 'include' | 'startsWith' | 'endsWith'
}

export default function HighlightWord({
    text,
    keyword,
    searchType,
  }: HighlightWordProps): JSX.Element {

    const title = text;
    const searchValue = keyword;
    let   isSearch:boolean = false;

    if(searchValue && title){
      if(searchType === 'include'){
        isSearch = searchValue !== '' && title.includes(searchValue);
      }
      else if(searchType === 'startsWith'){
        isSearch = searchValue !== '' && title.startsWith(searchValue);
      } 
      else if(searchType === 'endsWith'){
        isSearch = searchValue !== '' && title.endsWith(searchValue);
      } 
    }
    
    if (isSearch) {
        const matchText = text.split(new RegExp(`(${searchValue})`, 'gi'));
     
        return (
          <>
            {
              matchText.map((text, index) =>
                text === searchValue ? (
                    <span key={index} style={{ fontWeight: 600, background: '#f7cecc' }}>
                        {text}
                    </span>
                ) : (
                    text
                ),
            )}
          </>
        );
    }
  
      return (
        <>
          {text}
        </>
      );
}
