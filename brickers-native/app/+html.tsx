import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every
 * web page during static rendering.
 * The contents of this function only run in Node.js environments and
 * do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="ko">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

                {/*
          This resets the default browser styles for the scroll view to
          match the behavior of React Native's ScrollView.
        */}
                <ScrollViewStyleReset />

                {/* Using raw CSS styles as an escape hatch to ensure the background is white */}
                <style dangerouslySetInnerHTML={{ __html: `body { background-color: #fff; }` }} />

                {/* Kakao JavaScript SDK */}
                <script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" integrity="sha384-DKYJZ8NLiK8MN4/C5NYUZf8E5Gryz6O5obKQnQM066nQ3q5ls78ds8LpYBPrj13r" crossOrigin="anonymous"></script>
            </head>
            <body>{children}</body>
        </html>
    );
}
