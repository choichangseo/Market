import { ApolloClient, ApolloLink, InMemoryCache, ApolloProvider } from "@apollo/client";
import { createUploadLink } from "apollo-upload-client";
import { useRecoilState } from "recoil";
import { accessTokenState, userInfoState } from "../store";
import { onError } from "@apollo/client/link/error";
import { ReactNode, useEffect } from "react";
import { getAccessToken } from "../libraries/getAccessToken";

interface IApolloSetting{
    children: ReactNode
}

export default function ApolloSetting(props:IApolloSetting){
    const [accessToken,setAccessToken] = useRecoilState(accessTokenState);
    const [,setUserInfo] = useRecoilState(userInfoState)

    useEffect(() => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      setUserInfo(userInfo)
      getAccessToken().then((newAccessToken) => {
        setAccessToken(newAccessToken);
      });
    }, []);
    
    const errorLink = onError(({ graphQLErrors, operation, forward }) => {
      if (graphQLErrors) {
        for (const err of graphQLErrors) {
          if (err.extensions.code === "UNAUTHENTICATED") {
            getAccessToken().then((newAccessToken) => {
              setAccessToken(newAccessToken);
              operation.setContext({
                headers: {
                  ...operation.getContext().headers,
                  Authorization: `Bearer ${newAccessToken}`,
                },
              });
              return forward(operation);
            });
          }
        }
      }
    });


    const uploadLink = createUploadLink({
        uri: "https://backend06.codebootcamp.co.kr/graphql",
        headers:{authorization : `Bearer ${accessToken}`}
      });
      const client = new ApolloClient({
        link: ApolloLink.from([errorLink,uploadLink]),
        cache: new InMemoryCache(),
      });
    return(<ApolloProvider client={client}>{props.children}</ApolloProvider>)
}