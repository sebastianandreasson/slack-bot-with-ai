import styled from '@emotion/styled'
import React from 'react'
import DarkModeToggle from './components/DarkModeToggle'
import { Header, Navbar } from '@mantine/core'

const Container = styled.div`
  margin: 0 auto;
  width: 90%;
`

const App = () => {
  return (
    <>
      <Header
        height={64}
        sx={{
          margin: '0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1rem',
        }}
      >
        <div />
        <DarkModeToggle />
      </Header>
      <Container>
        <h1>Template</h1>
        <div>now build stuff</div>
      </Container>
    </>
  )
}

export default App
