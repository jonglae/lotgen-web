# LotGen 6/45

A small Korean Lotto 6/45 web app inspired by the number generator in the Android project [Lot_gen_2.1.17_stable](https://github.com/jonglae/Lot_gen_2.1.17_stable).

## Features

- Generate 1–10 sets of six distinct numbers from 1 to 45 using the browser's cryptographic random number generator.
- Copy or share generated sets.
- Reset all generated sets and manually entered draw numbers.
- Enter a draw's six winning numbers and bonus number to check ranks for all generated sets.
- Keep generated sets in the current browser using local storage.
- Open the official [Donghaeng Lottery results page](https://www.dhlottery.co.kr/lt645/result) to look up a draw.

QR scanning, ads, and automatic result fetching are not included. No official browser-accessible result API has been verified for this static prototype, so winning numbers are entered manually from the official results page.

## Run

Open `index.html` in a modern browser. For clipboard and sharing support, serve this folder from localhost or HTTPS. For example:

```sh
./bin/serve
```

Then open `http://localhost:8000`.

This app generates random combinations and does not predict or guarantee lottery results.
