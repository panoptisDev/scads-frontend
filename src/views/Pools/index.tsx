import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
// import { ethers } from 'ethers'
// import { formatUnits } from 'ethers/lib/utils'
import BigNumber from 'bignumber.js'
import { useWeb3React } from '@web3-react/core'
import { Heading, Flex, Text } from '@scads/uikit'
// import orderBy from 'lodash/orderBy'
import partition from 'lodash/partition'
import { useTranslation } from 'contexts/Localization'
import useIntersectionObserver from 'hooks/useIntersectionObserver'
import {
  useFetchPublicPoolsData,
  usePools,
  useFetchUserPools,
  useFetchCakeVault,
  useFetchIfoPool,
  useVaultPools,
} from 'state/pools/hooks'
import { usePollFarmsPublicData } from 'state/farms/hooks'
// import { latinise } from 'utils/latinise'
import FlexLayout from 'components/Layout/Flex'
import Page from 'components/Layout/Page'
import PageHeader from 'components/PageHeader'
import { DeserializedPool } from 'state/types'
import { useUserPoolStakedOnly } from 'state/user/hooks'
import { usePoolsWithVault } from 'views/Home/hooks/useGetTopPoolsByApr'
// import { BIG_ZERO } from 'utils/bigNumber'
import Loading from 'components/Loading'
import PoolCard from './components/PoolCard'
import ScadsPoolCard from './components/PoolCard/ScadsPoolCard'
import CaratPoolCard from './components/PoolCard/CaratPoolCard'
import CakeVaultCard from './components/CakeVaultCard'
import PoolTabButtons from './components/PoolTabButtons'
// import { getCakeVaultEarnings } from './helpers'

const CardLayout = styled(FlexLayout)`
  justify-content: center;
`

const PoolControls = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
  position: relative;

  justify-content: space-between;
  flex-direction: column;
  margin-bottom: 32px;

  ${({ theme }) => theme.mediaQueries.sm} {
    flex-direction: row;
    flex-wrap: wrap;
    padding: 16px 32px;
    margin-bottom: 0;
  }
`

const NUMBER_OF_POOLS_VISIBLE = 12

const Pools: React.FC = () => {
  const location = useLocation()
  const { t } = useTranslation()
  const { account } = useWeb3React()
  const { userDataLoaded } = usePools()
  const [stakedOnly, setStakedOnly] = useUserPoolStakedOnly()
  // const [viewMode, setViewMode] = useUserPoolsViewMode()
  const [numberOfPoolsVisible, setNumberOfPoolsVisible] = useState(NUMBER_OF_POOLS_VISIBLE)
  const { observerRef, isIntersecting } = useIntersectionObserver()
  // const [searchQuery, setSearchQuery] = useState('')
  // const [sortOption, setSortOption] = useState('hot')
  const sortOption = 'hot'
  const chosenPoolsLength = useRef(0)
  const vaultPools = useVaultPools()
  // const cakeInVaults = Object.values(vaultPools).reduce((total, vault) => {
  //   return total.plus(vault.totalCakeInVault)
  // }, BIG_ZERO)

  const pools = usePoolsWithVault()

  // TODO aren't arrays in dep array checked just by reference, i.e. it will rerender every time reference changes?
  const [finishedPools, openPools] = useMemo(
    () => partition(pools, (pool) => pool.isFinished && pool.sousId !== 0),
    [pools],
  )
  const stakedOnlyFinishedPools = useMemo(
    () =>
      finishedPools.filter((pool) => {
        if (pool.vaultKey) {
          return vaultPools[pool.vaultKey].userData.userShares && vaultPools[pool.vaultKey].userData.userShares.gt(0)
        }
        return pool.userData && new BigNumber(pool.userData.stakedBalance).isGreaterThan(0)
      }),
    [finishedPools, vaultPools],
  )
  const stakedOnlyOpenPools = useMemo(
    () =>
      openPools.filter((pool) => {
        if (pool.vaultKey) {
          return vaultPools[pool.vaultKey].userData.userShares && vaultPools[pool.vaultKey].userData.userShares.gt(0)
        }
        return pool.userData && new BigNumber(pool.userData.stakedBalance).isGreaterThan(0)
      }),
    [openPools, vaultPools],
  )
  const hasStakeInFinishedPools = stakedOnlyFinishedPools.length > 0

  usePollFarmsPublicData()
  useFetchCakeVault()
  useFetchIfoPool(false)
  useFetchPublicPoolsData()
  useFetchUserPools(account)

  useEffect(() => {
    if (isIntersecting) {
      setNumberOfPoolsVisible((poolsCurrentlyVisible) => {
        if (poolsCurrentlyVisible <= chosenPoolsLength.current) {
          return poolsCurrentlyVisible + NUMBER_OF_POOLS_VISIBLE
        }
        return poolsCurrentlyVisible
      })
    }
  }, [isIntersecting])

  const showFinishedPools = location.pathname.includes('history')

  const sortPools = (poolsToSort: DeserializedPool[]) => {
    switch (sortOption) {
      // case 'apr':
      //   // Ternary is needed to prevent pools without APR (like MIX) getting top spot
      //   return orderBy(poolsToSort, (pool: DeserializedPool) => (pool.apr ? pool.apr : 0), 'desc')
      // case 'earned':
      //   return orderBy(
      //     poolsToSort,
      //     (pool: DeserializedPool) => {
      //       if (!pool.userData || !pool.earningTokenPrice) {
      //         return 0
      //       }
      //       return pool.vaultKey
      //         ? getCakeVaultEarnings(
      //             account,
      //             vaultPools[pool.vaultKey].userData.cakeAtLastUserAction,
      //             vaultPools[pool.vaultKey].userData.userShares,
      //             vaultPools[pool.vaultKey].pricePerFullShare,
      //             pool.earningTokenPrice,
      //           ).autoUsdToDisplay
      //         : pool.userData.pendingReward.times(pool.earningTokenPrice).toNumber()
      //     },
      //     'desc',
      //   )
      // case 'totalStaked':
      //   return orderBy(
      //     poolsToSort,
      //     (pool: DeserializedPool) => {
      //       let totalStaked = Number.NaN
      //       // if (pool.vaultKey) {
      //       //   if (pool.stakingTokenPrice && vaultPools[pool.vaultKey].totalCakeInVault.isFinite()) {
      //       //     totalStaked =
      //       //       +formatUnits(
      //       //         ethers.BigNumber.from(vaultPools[pool.vaultKey].totalCakeInVault.toString()),
      //       //         pool.stakingToken.decimals,
      //       //       ) * pool.stakingTokenPrice
      //       //   }
      //       // } else if (pool.sousId === 0) {
      //       //   if (pool.totalStaked?.isFinite() && pool.stakingTokenPrice && cakeInVaults.isFinite()) {
      //       //     const manualCakeTotalMinusAutoVault = ethers.BigNumber.from(pool.totalStaked.toString()).sub(
      //       //       cakeInVaults.toString(),
      //       //     )
      //       //     totalStaked =
      //       //       +formatUnits(manualCakeTotalMinusAutoVault, pool.stakingToken.decimals) * pool.stakingTokenPrice
      //       //   }
      //       // } else
      //       if (pool.totalStaked?.isFinite() && pool.stakingTokenPrice) {
      //         totalStaked =
      //           +formatUnits(ethers.BigNumber.from(pool.totalStaked.toString()), pool.stakingToken.decimals) *
      //           pool.stakingTokenPrice
      //       }
      //       return Number.isFinite(totalStaked) ? totalStaked : 0
      //     },
      //     'desc',
      //   )
      default:
        return poolsToSort
    }
  }

  let chosenPools
  if (showFinishedPools) {
    chosenPools = stakedOnly ? stakedOnlyFinishedPools : finishedPools
  } else {
    chosenPools = stakedOnly ? stakedOnlyOpenPools : openPools
  }

  // if (searchQuery) {
  //   const lowercaseQuery = latinise(searchQuery.toLowerCase())
  //   chosenPools = chosenPools.filter((pool) =>
  //     latinise(pool.earningToken.symbol.toLowerCase()).includes(lowercaseQuery),
  //   )
  // }

  chosenPools = sortPools(chosenPools).slice(0, numberOfPoolsVisible)
  chosenPoolsLength.current = chosenPools.length

  const cardLayout = (
    <CardLayout>
      {chosenPools.map((pool) =>
        pool.vaultKey ? (
          <CakeVaultCard key={pool.vaultKey} pool={pool} showStakedOnly={stakedOnly} />
        ) : pool.sousId === 0 ? ( // scads pool
          <ScadsPoolCard key={pool.sousId} pool={pool} account={account} />
        ) : pool.sousId === 1 ? ( // carat pool
          <CaratPoolCard key={pool.sousId} pool={pool} account={account} />
        ) : (
          <PoolCard key={pool.sousId} pool={pool} account={account} />
        ),
      )}
    </CardLayout>
  )

  return (
    <>
      <PageHeader>
        <Flex justifyContent="space-between" flexDirection={['column', null, null, 'row']}>
          <Flex flex="1" flexDirection="column" mr={['8px', 0]}>
            <Heading as="h1" scale="xxl" color="overlay" mb="24px">
              {t('Scads Pools')}
            </Heading>
            <Heading scale="md" color="overlay">
              {t('Just stake some tokens to earn.')}
            </Heading>
            <Heading scale="md" color="overlay">
              {t('High APR, low risk.')}
            </Heading>
          </Flex>
          {/* <Flex flex="1" height="fit-content" justifyContent="center" alignItems="center" mt={['24px', null, '0']}>
            <BountyCard />
          </Flex> */}
        </Flex>
      </PageHeader>
      <Page>
        <PoolControls>
          <PoolTabButtons
            stakedOnly={stakedOnly}
            setStakedOnly={setStakedOnly}
            hasStakeInFinishedPools={hasStakeInFinishedPools}
          />
        </PoolControls>
        {showFinishedPools && (
          <Text fontSize="20px" color="failure" pb="32px">
            {t('These pools are no longer distributing rewards. Please unstake your tokens.')}
          </Text>
        )}
        {account && !userDataLoaded && stakedOnly && (
          <Flex justifyContent="center" mb="4px">
            <Loading />
          </Flex>
        )}
        {cardLayout}
        <div ref={observerRef} />
      </Page>
    </>
  )
}

export default Pools
