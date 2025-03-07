import { useMemo, useRef, type FC } from "react";
import { api } from "~/utils/api";
import Image from "next/image";

import { useState } from "react";
import TokenCard from "~/components/Token/Card";
import Link from "next/link";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

type Props = {
  category: string;
  query?: string;
  address?: string;
}

export const TokenGrid: FC<Props> = ({ category, query, address }) => {
  const { data: tokens, isLoading: tokensIsLoading } = api.coingecko.getTokens.useQuery({
    category,
    sparkline: true,
  }, {
    enabled: category !== "NFTs and collectibles",
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: pinnedToken } = api.coingecko.getTokenCardDataById.useQuery({
    id: 'mochi-thecatcoin',
  }, {
    enabled: !!query,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { data: searchedTokens, isLoading: searchIsLoading } = api.coingecko.searchTokens.useQuery({
    query: query ?? '',
  }, {
    enabled: !!query,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { 
    data: tokenAddresses,
    isLoading: tokenAddressesIsLoading,
  } = api.coingecko.getTokenAddresses.useQuery({
    ids: tokens?.map((token) => token.id) ?? [],
  }, {
    enabled: !!tokens,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const { 
    data: searchedTokenAddresses,
    isLoading: searchedTokenAddressesIsLoading,
  } = api.coingecko.getTokenAddresses.useQuery({
    ids: searchedTokens?.map((token) => token.id) ?? [],
  }, {
    enabled: !!searchedTokens,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  
  const { 
    data: tokensOwnedByAddress, 
    isLoading: tokensOwnedByAddressIsLoading 
  } = api.simpleHash.getFungibles.useQuery({
    address,
    chain: 'base',
  }, {
    enabled: category !== "NFTs and collectibles" && !!address,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const tokensPerPage = 8;
  const indexOfLastToken = currentPage * tokensPerPage;
  const indexOfFirstToken = indexOfLastToken - tokensPerPage;

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const totalPages = tokens ? Math.ceil(tokens.length / tokensPerPage) : 0;

  const tokensInScope = useMemo(() => {
    // only include tokens with a base address
    let scopedTokens = tokens?.map((token) => {
      const tokenWithAddress = tokenAddresses?.find((t) => t.id === token.id);
      const baseAddress = tokenWithAddress?.platforms?.base;
      return { ...token, address: baseAddress };
    }).filter((token) => token.address);

    if (pinnedToken) {
      const pinnedTokenAddress = tokenAddresses?.find((t) => t.id === pinnedToken.id)?.platforms?.base;
      scopedTokens?.unshift({
        ...pinnedToken,
        address: pinnedTokenAddress,
      });
    }

    // if there is a search, filter the tokens
    if (query) {
      const filteredTokens = !scopedTokens ? [] : scopedTokens.filter((token) => 
        token.name.toLowerCase().includes(query.toLowerCase())
      );
      const tokensFoundInSearch = !searchedTokens ? [] : searchedTokens.map((token) => {
        const tokenWithAddress = searchedTokenAddresses?.find((t) => t.id === token.id);
        const baseAddress = tokenWithAddress?.platforms?.base;
        return { ...token, address: baseAddress };
      }).filter(t => t.address);
      
      scopedTokens = [...filteredTokens, ...tokensFoundInSearch].filter((token, index, self) =>
        index === self.findIndex((t) => t.address === token.address)
      );
    }

    // if there is an address, filter the tokens by the address ownership
    if (address) {
      scopedTokens = scopedTokens?.filter((token) => {
        return tokensOwnedByAddress?.find((t) => t.fungible_id.split('base.')[1]?.toLowerCase() === token.address?.toLowerCase());
      });
    }

    // no pagination for search or address tokens
    if (query ?? address) {
      return scopedTokens;
    }

    // return paginated tokens
    return scopedTokens?.slice(indexOfFirstToken, indexOfLastToken);
  }, [tokens, pinnedToken, query, address, indexOfFirstToken, indexOfLastToken, tokenAddresses, searchedTokens, searchedTokenAddresses, tokensOwnedByAddress]);


  const { 
    data: fallbackToken, 
    isLoading: fallbackTokenIsLoading 
  } = api.coingecko.getTokenCardDataById.useQuery({
    id: 'mochi-thecatcoin',
  }, {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const isLoading = useMemo(() => {
    return tokensOwnedByAddressIsLoading || tokensIsLoading || 
      searchIsLoading || fallbackTokenIsLoading ||
      tokenAddressesIsLoading || searchedTokenAddressesIsLoading;
  }, [
    tokensOwnedByAddressIsLoading, tokensIsLoading, searchIsLoading, 
    fallbackTokenIsLoading, tokenAddressesIsLoading, searchedTokenAddressesIsLoading
  ]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const [dragCursor, setDragCursor] = useState<string>('cursor-grab');

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (scrollContainerRef.current?.offsetLeft ?? 0);
    scrollLeft.current = scrollContainerRef.current?.scrollLeft ?? 0;
    setDragCursor('cursor-grabbing');
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
    setDragCursor('cursor-grab');
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    setDragCursor('cursor-grab');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft ?? 0);
    const walk = (x - startX.current) * 1.5;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
    }
  };

  const TokenLoadingCard: FC = () => (
    <div className="card max-w-[236px] bg-base-200 raise-on-hover cursor-pointer">
      <div className="card-body p-4 animate-pulse">
        <div className="flex items-center justify-between gap-2">
          <div className="bg-base-300 w-14 rounded-full h-14" />
          <div className="flex flex-col gap-2">
            <div className="bg-base-300 w-20 rounded h-4" />
            <div className="bg-base-300 w-20 rounded h-4" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="bg-base-300 w-32 rounded h-6" />
          <div className="bg-base-300 w-20 rounded h-4" />
        </div>
        <div className="bg-base-300 w-full h-28 sm:h-42 rounded-lg" />
        <div className="bg-base-300 w-28 rounded-full h-12" />
      </div>
    </div>
  );

  const TokenNotFound: FC = () => {
    const { data: catPic } = api.cats.getCatPic.useQuery(undefined, {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    });
    if (address) {
      return (
        <div className="w-full bg-base-200 p-4 m-4 rounded-xl text-center">
          {query ? 'Not holding any of the tokens in this search' : 'Not holding any of the tokens offerred on the store'}
        </div>
      )
    }
    return (
      <div className="flex flex-col w-full items-center justify-center gap-2">
        <div className="card max-w-xs bg-base-200 text-center justify-center flex sm:raise-on-hover cursor-pointer">
          <div className="card-body p-4">
            <div className="flex w-full flex-col gap-2 justify-center">
              <div className="w-full flex items-center justify-center">
                <div className="bg-warning w-14 rounded-full h-14 flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-8 w-8 stroke-2 text-warning-content" />
                </div>
              </div>
              <div className="flex flex-col grow">
                <span className="text-lg font-bold">No tokens found</span>
                <span className="text-sm">Try another search</span>
                <span className="text-sm mt-4 flex">
                  <span>
                    This empty search result feature and cat picture is brought to you by
                    🐾 <Link href="https://pawthereum.com" className="underline">Pawthereum</Link>
                  </span>
                </span>
                <span className="text-xs mt-4 flex">
                  <span>
                    Your token community can <Link href="https://github.com/mykcryptodev/base-token-store" className="underline">contribute features</Link> on Base Token Store to gain exposure!
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex sm:flex-row flex-col items-center gap-2">
          <div className="flex justify-center">
            {!fallbackToken ? (
              <TokenLoadingCard />
            ) : (
              <TokenCard key={fallbackToken.id} token={fallbackToken} />
            )}
          </div>
          {catPic ? (
            <div className={`card max-w-[236px] min-h-[300px] bg-base-100 raise-on-hover cursor-pointer overflow-hidden`}>
              <Image src={catPic} alt="Cat says: Oh noez! No token found!" width={300} height={300} className="rounded-lg" />
            </div>
          ) : (
            <TokenLoadingCard />
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-5xl mx-auto ${address ? '' : 'min-h-[732px]'}`}>
        {!isLoading && tokensInScope?.length === 0 && (
          <TokenNotFound />
        )}
        <div 
          className={`flex flex-col overflow-x-auto min-w-full ${dragCursor}`}
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div 
            className={`flex flex-nowrap items-stretch w-full gap-4 pb-6 pt-2 ${!tokensInScope?.length && !isLoading ? 'hidden' : ''}`}
          >
            {tokensInScope?.map((token) => <TokenCard key={token.id} token={token} />)}
            {isLoading && Array.from({ length: tokensPerPage }, (_, index) => (
              <TokenLoadingCard key={index} />
            ))}
          </div>
        </div>
        <div className="flex flex-col overflow-x-auto min-w-full">
          <div className={`flex w-full justify-end ${address ? 'hidden' : ''}`}>
            <Link href="https://coingecko.com" target="_blank" rel="noopener noreferrer" className="flex gap-1 items-center">
              <span className="text-xs opacity-90">Token data provided by</span><Image src="/images/coingecko.webp" alt="Powered by CoinGecko" width={85} height={85} />
            </Link>
          </div>
          {!query && !address && (
            <div className="flex items-center justify-center mt-4">
              <button 
                className="sm:flex hidden btn btn-secondary mr-2" 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <div className="join">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    className={`join-item md:btn sm:btn-sm btn-xs btn-secondary ${currentPage === index + 1 ? '!btn-active' : ''}`}
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              <button 
                className="sm:flex hidden btn btn-secondary ml-2" 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default TokenGrid;