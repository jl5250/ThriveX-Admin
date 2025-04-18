import { Link } from 'react-router-dom';
interface BreadcrumbProps {
  pageName: string;
}
const Breadcrumb = ({ pageName }: BreadcrumbProps) => {
  return (
    <div className="flex gap-3 flex-row items-center justify-between text-sm">
      <h2 className="text-title-md2 font-semibold text-black dark:text-white text-xl">
        {pageName}
      </h2>

      <nav>
        <ol className="flex items-center gap-2">
          <li>
            <Link className="font-medium" to="/">仪表盘</Link>
          </li>

          <span className='px-2'>/</span>

          <li className="font-medium text-primary">{pageName}</li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
