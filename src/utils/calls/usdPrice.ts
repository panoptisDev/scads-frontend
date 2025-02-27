import { useEffect, useState } from 'react'

export const useBtcUSDPrice = () => {
  const [price, setPrice] = useState(1)
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
      .then((res) => res.json())
      .then((data) => {
        setPrice(data.bitcoin.usd)
      })
  }, [])

  return price
}

export const useEthUSDPrice = () => {
  const [price, setPrice] = useState(1)
  useEffect(() => {
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
      .then((res) => res.json())
      .then((data) => {
        setPrice(data.ethereum.usd)
      })
  }, [])

  return price
}
