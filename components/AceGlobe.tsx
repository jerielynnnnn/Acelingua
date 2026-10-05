import React from 'react';
import styled from 'styled-components';

const Loader = () => {
  return (
    <StyledWrapper>
      <div>
        <div id="cont">
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="point" />
          <div className="continent c1" />
          <div className="continent c2" />
          <div className="continent c3" />
          <div className="continent c4" />
          <div className="continent c5" />
          <div className="continent c6" />
          <div className="continent c7" />
          <div className="continent c8" />
          <div className="continent c9" />
          <div className="continent c10" />
          <div className="continent c11" />
          <div className="continent c12" />
          <div className="continent c13" />
          <div className="continent c14" />
          <div className="continent c15" />
          <div className="continent c16" />
          <div className="continent c17" />
          <div className="continent c18" />
          <div className="continent c19" />
          <div className="continent c20" />
          <div className="continent c21" />
          <div className="continent c22" />
          <div className="continent c23" />
          <div className="continent c24" />
          <div className="continent c25" />
          <div className="continent c26" />
          <div className="continent c27" />
          <div className="continent c28" />
          <div className="continent c29" />
          <div className="continent c30" />
          <div className="continent c31" />
          <div className="continent c32" />
          <div className="continent c33" />
          <div className="continent c34" />
          <div className="continent c35" />
          <div className="continent c36" />
          <div className="continent c37" />
          <div className="continent c38" />
          <div className="continent c39" />
          <div className="continent c40" />
          <div className="continent c41" />
          <div className="continent c42" />
          <div className="continent c43" />
          <div className="continent c44" />
          <div className="continent c45" />
          <div className="continent c46" />
          <div className="continent c47" />
          <div className="continent c48" />
          <div className="continent c49" />
          <div className="continent c50" />
        </div>
        <div className="base">
          <div className="base">
            <div className="base">
              <div className="base">
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
                <div className="base" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  #cont {
    scale: 0.6;
    z-index: 100;
    margin: 0;
    display: grid;
    place-items: center;
    height: 100%;
    background: rgb(38, 22, 22);
    perspective: 10000px;
    transform-style: preserve-3d;
    animation: spin 5s linear infinite;
  }

  .point {
    position: absolute;
    width: 81px;
    height: 81px;
    margin: -5px 0 0 -5px;
    border-radius: 15%;
    background: #5a90ff;
    box-shadow: 0 0 1px -0.3px #ffffff53;
    z-index: 100;
  }

  .base {
    scale: 0.9;
    position: absolute;
    width: 324.5px;
    height: 324.5px;
    border-radius: 100%;
    background: #60a1f514;
    box-shadow: 0 0 1px -0.3px #ffffff53;
    z-index: 0;
  }

  #green {
    border-radius: 0%;
    background: radial-gradient(
      ellipse 8vmin 10vmin at 20% 25%,
      var(--land-dark, #2a3d26) 0 70%,
      #5a90ff 71%
    );
    z-index: 0;
  }

  @keyframes spin {
    0% {
      transform: rotateZ(90deg) rotateX(0deg);
    }
    50% {
      transform: rotateZ(90deg) rotateX(180deg);
    }
    100% {
      transform: rotateZ(90deg) rotateX(360deg);
    }
  }

  /* lon-60 */
  .point:nth-child(2) {
    transform: rotateX(-60deg) rotateY(0deg) translateZ(150px);
  }
  .point:nth-child(3) {
    transform: rotateX(-60deg) rotateY(30deg) translateZ(150px);
  }
  .point:nth-child(4) {
    transform: rotateX(-60deg) rotateY(60deg) translateZ(150px);
  }
  .point:nth-child(5) {
    transform: rotateX(-60deg) rotateY(90deg) translateZ(150px);
  }
  .point:nth-child(6) {
    transform: rotateX(-60deg) rotateY(120deg) translateZ(150px);
  }
  .point:nth-child(7) {
    transform: rotateX(-60deg) rotateY(150deg) translateZ(150px);
  }
  .point:nth-child(8) {
    transform: rotateX(-60deg) rotateY(180deg) translateZ(150px);
  }
  .point:nth-child(9) {
    transform: rotateX(-60deg) rotateY(210deg) translateZ(150px);
  }
  .point:nth-child(10) {
    transform: rotateX(-60deg) rotateY(240deg) translateZ(150px);
  }
  .point:nth-child(11) {
    transform: rotateX(-60deg) rotateY(270deg) translateZ(150px);
  }
  .point:nth-child(12) {
    transform: rotateX(-60deg) rotateY(300deg) translateZ(150px);
  }
  .point:nth-child(13) {
    transform: rotateX(-60deg) rotateY(330deg) translateZ(150px);
  }

  /* lon-30 */
  .point:nth-child(14) {
    transform: rotateX(-30deg) rotateY(0deg) translateZ(150px);
  }
  .point:nth-child(15) {
    transform: rotateX(-30deg) rotateY(30deg) translateZ(150px);
  }
  .point:nth-child(16) {
    transform: rotateX(-30deg) rotateY(60deg) translateZ(150px);
  }
  .point:nth-child(17) {
    transform: rotateX(-30deg) rotateY(90deg) translateZ(150px);
  }
  .point:nth-child(18) {
    transform: rotateX(-30deg) rotateY(120deg) translateZ(150px);
  }
  .point:nth-child(19) {
    transform: rotateX(-30deg) rotateY(150deg) translateZ(150px);
  }
  .point:nth-child(20) {
    transform: rotateX(-30deg) rotateY(180deg) translateZ(150px);
  }
  .point:nth-child(21) {
    transform: rotateX(-30deg) rotateY(210deg) translateZ(150px);
  }
  .point:nth-child(22) {
    transform: rotateX(-30deg) rotateY(240deg) translateZ(150px);
  }
  .point:nth-child(23) {
    transform: rotateX(-30deg) rotateY(270deg) translateZ(150px);
  }
  .point:nth-child(24) {
    transform: rotateX(-30deg) rotateY(300deg) translateZ(150px);
  }
  .point:nth-child(25) {
    transform: rotateX(-30deg) rotateY(330deg) translateZ(150px);
  }

  /* lon+0 */
  .point:nth-child(26) {
    transform: rotateX(0deg) rotateY(0deg) translateZ(150px);
  }
  .point:nth-child(27) {
    transform: rotateX(0deg) rotateY(30deg) translateZ(150px);
  }
  .point:nth-child(28) {
    transform: rotateX(0deg) rotateY(60deg) translateZ(150px);
  }
  .point:nth-child(29) {
    transform: rotateX(0deg) rotateY(90deg) translateZ(150px);
  }
  .point:nth-child(30) {
    transform: rotateX(0deg) rotateY(120deg) translateZ(150px);
  }
  .point:nth-child(31) {
    transform: rotateX(0deg) rotateY(150deg) translateZ(150px);
  }
  .point:nth-child(32) {
    transform: rotateX(0deg) rotateY(180deg) translateZ(150px);
  }
  .point:nth-child(33) {
    transform: rotateX(0deg) rotateY(210deg) translateZ(150px);
  }
  .point:nth-child(34) {
    transform: rotateX(0deg) rotateY(240deg) translateZ(150px);
  }
  .point:nth-child(35) {
    transform: rotateX(0deg) rotateY(270deg) translateZ(150px);
  }
  .point:nth-child(36) {
    transform: rotateX(0deg) rotateY(300deg) translateZ(150px);
  }
  .point:nth-child(37) {
    transform: rotateX(0deg) rotateY(330deg) translateZ(150px);
  }

  /* lon+30 */
  .point:nth-child(38) {
    transform: rotateX(30deg) rotateY(0deg) translateZ(150px);
  }
  .point:nth-child(39) {
    transform: rotateX(30deg) rotateY(30deg) translateZ(150px);
  }
  .point:nth-child(40) {
    transform: rotateX(30deg) rotateY(60deg) translateZ(150px);
  }
  .point:nth-child(41) {
    transform: rotateX(30deg) rotateY(90deg) translateZ(150px);
  }
  .point:nth-child(42) {
    transform: rotateX(30deg) rotateY(120deg) translateZ(150px);
  }
  .point:nth-child(43) {
    transform: rotateX(30deg) rotateY(150deg) translateZ(150px);
  }
  .point:nth-child(44) {
    transform: rotateX(30deg) rotateY(180deg) translateZ(150px);
  }
  .point:nth-child(45) {
    transform: rotateX(30deg) rotateY(210deg) translateZ(150px);
  }
  .point:nth-child(46) {
    transform: rotateX(30deg) rotateY(240deg) translateZ(150px);
  }
  .point:nth-child(47) {
    transform: rotateX(30deg) rotateY(270deg) translateZ(150px);
  }
  .point:nth-child(48) {
    transform: rotateX(30deg) rotateY(300deg) translateZ(150px);
  }
  .point:nth-child(49) {
    transform: rotateX(30deg) rotateY(330deg) translateZ(150px);
  }

  /* lon+60 */
  .point:nth-child(50) {
    transform: rotateX(60deg) rotateY(0deg) translateZ(150px);
  }
  .point:nth-child(51) {
    transform: rotateX(60deg) rotateY(30deg) translateZ(150px);
  }
  .point:nth-child(52) {
    transform: rotateX(60deg) rotateY(60deg) translateZ(150px);
  }
  .point:nth-child(53) {
    transform: rotateX(60deg) rotateY(90deg) translateZ(150px);
  }
  .point:nth-child(54) {
    transform: rotateX(60deg) rotateY(120deg) translateZ(150px);
  }
  .point:nth-child(55) {
    transform: rotateX(60deg) rotateY(150deg) translateZ(150px);
  }
  .point:nth-child(56) {
    transform: rotateX(60deg) rotateY(180deg) translateZ(150px);
  }
  .point:nth-child(57) {
    transform: rotateX(60deg) rotateY(210deg) translateZ(150px);
  }
  .point:nth-child(58) {
    transform: rotateX(60deg) rotateY(240deg) translateZ(150px);
  }
  .point:nth-child(59) {
    transform: rotateX(60deg) rotateY(270deg) translateZ(150px);
  }
  .point:nth-child(60) {
    transform: rotateX(60deg) rotateY(300deg) translateZ(150px);
  }
  .point:nth-child(61) {
    transform: rotateX(60deg) rotateY(330deg) translateZ(150px);
  }

  /* lon+90 */
  .point:nth-child(62) {
    transform: rotateX(90deg) rotateY(0deg) translateZ(150px);
  }
  .point:nth-child(63) {
    transform: rotateX(90deg) rotateY(30deg) translateZ(150px);
  }
  .point:nth-child(64) {
    transform: rotateX(90deg) rotateY(60deg) translateZ(150px);
  }
  .point:nth-child(65) {
    transform: rotateX(90deg) rotateY(90deg) translateZ(150px);
  }
  .point:nth-child(66) {
    transform: rotateX(90deg) rotateY(120deg) translateZ(150px);
  }
  .point:nth-child(67) {
    transform: rotateX(90deg) rotateY(150deg) translateZ(150px);
  }
  .point:nth-child(68) {
    transform: rotateX(90deg) rotateY(180deg) translateZ(150px);
  }
  .point:nth-child(69) {
    transform: rotateX(90deg) rotateY(210deg) translateZ(150px);
  }
  .point:nth-child(70) {
    transform: rotateX(90deg) rotateY(240deg) translateZ(150px);
  }
  .point:nth-child(71) {
    transform: rotateX(90deg) rotateY(270deg) translateZ(150px);
  }
  .point:nth-child(72) {
    transform: rotateX(90deg) rotateY(300deg) translateZ(150px);
  }
  .point:nth-child(73) {
    transform: rotateX(90deg) rotateY(330deg) translateZ(150px);
  }

  .continent {
    position: absolute;
    width: 132px;
    height: 132px;
    background: radial-gradient(rgba(98, 172, 98, 0.9) 54%, transparent 55%);
    border: 1px solid rgba(0, 0, 0, 0.525);
    transform-style: preserve-3d;
  }

  .c1 {
    clip-path: polygon(20% 0%, 90% 15%, 70% 95%, 10% 70%);
    transform: rotateX(10deg) rotateY(20deg) translateZ(157px);
  }
  .c2 {
    clip-path: polygon(15% 10%, 95% 20%, 80% 85%, 5% 70%);
    transform: rotateX(12deg) rotateY(23deg) translateZ(157px);
  }
  .c3 {
    clip-path: polygon(30% 0%, 85% 15%, 90% 80%, 15% 95%);
    transform: rotateX(8deg) rotateY(18deg) translateZ(157px);
  }
  .c4 {
    clip-path: polygon(25% 5%, 100% 25%, 75% 90%, 5% 70%);
    transform: rotateX(14deg) rotateY(21deg) translateZ(157px);
  }
  .c5 {
    clip-path: polygon(10% 25%, 90% 5%, 85% 70%, 30% 95%);
    transform: rotateX(9deg) rotateY(24deg) translateZ(157px);
  }
  .c6 {
    clip-path: polygon(20% 10%, 80% 0%, 95% 70%, 25% 95%);
    transform: rotateX(11deg) rotateY(16deg) translateZ(157px);
  }
  .c7 {
    clip-path: polygon(15% 0%, 95% 20%, 70% 100%, 5% 80%);
    transform: rotateX(7deg) rotateY(22deg) translateZ(157px);
  }
  .c8 {
    clip-path: polygon(25% 0%, 85% 15%, 100% 75%, 15% 95%);
    transform: rotateX(13deg) rotateY(19deg) translateZ(157px);
  }
  .c9 {
    clip-path: polygon(10% 10%, 90% 5%, 80% 85%, 20% 95%);
    transform: rotateX(10deg) rotateY(26deg) translateZ(157px);
  }
  .c10 {
    clip-path: polygon(20% 5%, 95% 25%, 70% 95%, 10% 75%);
    transform: rotateX(6deg) rotateY(20deg) translateZ(157px);
  }

  .c11 {
    clip-path: polygon(15% 5%, 90% 15%, 75% 95%, 5% 80%);
    transform: rotateX(-20deg) rotateY(60deg) translateZ(157px);
  }
  .c12 {
    clip-path: polygon(25% 0%, 85% 20%, 95% 75%, 10% 95%);
    transform: rotateX(-22deg) rotateY(63deg) translateZ(157px);
  }
  .c13 {
    clip-path: polygon(20% 10%, 95% 5%, 85% 80%, 15% 90%);
    transform: rotateX(-18deg) rotateY(58deg) translateZ(157px);
  }
  .c14 {
    clip-path: polygon(30% 0%, 90% 25%, 70% 95%, 5% 70%);
    transform: rotateX(-21deg) rotateY(64deg) translateZ(157px);
  }
  .c15 {
    clip-path: polygon(15% 15%, 100% 10%, 85% 85%, 20% 95%);
    transform: rotateX(-19deg) rotateY(56deg) translateZ(157px);
  }
  .c16 {
    clip-path: polygon(25% 5%, 95% 20%, 75% 90%, 10% 70%);
    transform: rotateX(-23deg) rotateY(61deg) translateZ(157px);
  }
  .c17 {
    clip-path: polygon(20% 0%, 90% 10%, 100% 70%, 15% 95%);
    transform: rotateX(-17deg) rotateY(59deg) translateZ(157px);
  }
  .c18 {
    clip-path: polygon(15% 5%, 85% 20%, 70% 85%, 5% 70%);
    transform: rotateX(-24deg) rotateY(62deg) translateZ(157px);
  }

  .c19 {
    transform: rotateX(40deg) rotateY(-30deg) translateZ(157px);
    clip-path: polygon(20% 0%, 90% 20%, 80% 90%, 10% 70%);
  }
  .c20 {
    transform: rotateX(42deg) rotateY(-28deg) translateZ(157px);
    clip-path: polygon(25% 5%, 95% 20%, 70% 95%, 5% 70%);
  }
  .c21 {
    transform: rotateX(38deg) rotateY(-32deg) translateZ(157px);
    clip-path: polygon(30% 0%, 85% 15%, 100% 75%, 15% 95%);
  }
  .c22 {
    transform: rotateX(43deg) rotateY(-27deg) translateZ(157px);
    clip-path: polygon(15% 10%, 90% 5%, 80% 85%, 20% 95%);
  }
  .c23 {
    transform: rotateX(39deg) rotateY(-29deg) translateZ(157px);
    clip-path: polygon(20% 5%, 95% 25%, 70% 95%, 10% 75%);
  }
  .c24 {
    transform: rotateX(41deg) rotateY(-31deg) translateZ(157px);
    clip-path: polygon(10% 20%, 90% 10%, 85% 80%, 30% 95%);
  }
  .c25 {
    transform: rotateX(44deg) rotateY(-33deg) translateZ(157px);
    clip-path: polygon(25% 0%, 100% 20%, 75% 90%, 15% 95%);
  }
  .c26 {
    transform: rotateX(37deg) rotateY(-34deg) translateZ(157px);
    clip-path: polygon(15% 15%, 85% 5%, 95% 80%, 20% 95%);
  }
  .c27 {
    transform: rotateX(45deg) rotateY(-29deg) translateZ(157px);
    clip-path: polygon(30% 0%, 90% 15%, 80% 100%, 10% 70%);
  }
  .c28 {
    transform: rotateX(36deg) rotateY(-35deg) translateZ(157px);
    clip-path: polygon(20% 0%, 80% 10%, 95% 70%, 25% 95%);
  }

  .c29 {
    transform: rotateX(-10deg) rotateY(150deg) translateZ(157px);
    clip-path: polygon(30% 0%, 90% 20%, 70% 90%, 10% 70%);
  }
  .c30 {
    transform: rotateX(-12deg) rotateY(153deg) translateZ(157px);
    clip-path: polygon(25% 5%, 85% 15%, 95% 75%, 15% 95%);
  }
  .c31 {
    transform: rotateX(-14deg) rotateY(156deg) translateZ(157px);
    clip-path: polygon(20% 10%, 95% 0%, 80% 85%, 20% 95%);
  }
  .c32 {
    transform: rotateX(-16deg) rotateY(159deg) translateZ(157px);
    clip-path: polygon(10% 20%, 90% 5%, 85% 70%, 30% 95%);
  }
  .c33 {
    transform: rotateX(-18deg) rotateY(162deg) translateZ(157px);
    clip-path: polygon(20% 0%, 85% 15%, 100% 75%, 15% 95%);
  }
  .c34 {
    transform: rotateX(-20deg) rotateY(165deg) translateZ(157px);
    clip-path: polygon(15% 15%, 95% 5%, 90% 85%, 25% 95%);
  }

  .c35 {
    transform: rotateX(5deg) rotateY(-150deg) translateZ(157px);
    clip-path: polygon(30% 0%, 90% 20%, 70% 90%, 10% 70%);
  }
  .c36 {
    transform: rotateX(-45deg) rotateY(120deg) translateZ(157px);
    clip-path: polygon(25% 5%, 95% 20%, 70% 95%, 5% 70%);
  }
  .c37 {
    transform: rotateX(50deg) rotateY(90deg) translateZ(157px);
    clip-path: polygon(20% 10%, 95% 0%, 85% 85%, 15% 95%);
  }
  .c38 {
    transform: rotateX(-60deg) rotateY(200deg) translateZ(157px);
    clip-path: polygon(10% 20%, 90% 5%, 100% 80%, 30% 95%);
  }
  .c39 {
    transform: rotateX(25deg) rotateY(-100deg) translateZ(157px);
    clip-path: polygon(20% 0%, 80% 10%, 90% 70%, 30% 95%);
  }
  .c40 {
    transform: rotateX(15deg) rotateY(75deg) translateZ(157px);
    clip-path: polygon(15% 0%, 95% 20%, 80% 85%, 10% 70%);
  }
  .c41 {
    transform: rotateX(-30deg) rotateY(-60deg) translateZ(157px);
    clip-path: polygon(25% 0%, 85% 15%, 95% 75%, 15% 95%);
  }
  .c42 {
    transform: rotateX(35deg) rotateY(140deg) translateZ(157px);
    clip-path: polygon(10% 10%, 90% 0%, 80% 80%, 20% 95%);
  }
  .c43 {
    transform: rotateX(60deg) rotateY(-10deg) translateZ(157px);
    clip-path: polygon(30% 0%, 90% 25%, 70% 95%, 10% 75%);
  }
  .c44 {
    transform: rotateX(-55deg) rotateY(-130deg) translateZ(157px);
    clip-path: polygon(20% 5%, 95% 20%, 85% 80%, 15% 90%);
  }
  .c45 {
    transform: rotateX(0deg) rotateY(30deg) translateZ(157px);
    clip-path: polygon(25% 0%, 85% 20%, 70% 90%, 5% 70%);
  }
  .c46 {
    transform: rotateX(-10deg) rotateY(-170deg) translateZ(157px);
    clip-path: polygon(15% 15%, 95% 5%, 90% 85%, 20% 95%);
  }
  .c47 {
    transform: rotateX(20deg) rotateY(200deg) translateZ(157px);
    clip-path: polygon(20% 0%, 80% 15%, 100% 70%, 15% 95%);
  }
  .c48 {
    transform: rotateX(-25deg) rotateY(15deg) translateZ(157px);
    clip-path: polygon(30% 0%, 95% 20%, 75% 95%, 10% 70%);
  }
  .c49 {
    transform: rotateX(45deg) rotateY(-200deg) translateZ(157px);
    clip-path: polygon(10% 20%, 90% 0%, 85% 70%, 20% 95%);
  }
  .c50 {
    transform: rotateX(-35deg) rotateY(180deg) translateZ(157px);
    clip-path: polygon(25% 0%, 85% 25%, 95% 75%, 15% 95%);
  }

  .cloud {
    position: absolute;
    width: 82px;
    height: 152px;
    background: radial-gradient(rgba(239, 218, 233, 0.697) 54%, transparent 55%);
    border: 1px solid rgba(0, 0, 0, 0.525);
    transform-style: preserve-3d;
  }`;

export default Loader;
