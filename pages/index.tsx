import { Welcome } from '../components/Welcome/Welcome';
import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import MangaCrop from './mangaCrop/MangaCrop';
import dynamic from 'next/dynamic';
const DynamicComponent = dynamic(() => import('./mangaCrop/MangaCrop'))
console.log('%c [ DynamicComponent ]-49', 'font-size:13px; background:pink; color:#bf2c9f;', DynamicComponent)


export default function HomePage() {
  return (
    <>
      {/* <MangaCrop /> */}
      <DynamicComponent />
    </>
  );
}
