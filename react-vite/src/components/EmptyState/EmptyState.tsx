import { Link } from "react-router-dom";
import { EmptyStateProps } from "../../types";

const EmptyState: React.FC<EmptyStateProps> = ({
	icon: Icon,
	title,
	description,
	actionButton,
}) => (
	<div className="text-center py-16">
		<div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-md mx-auto">
			<div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-slate-600 rounded-full flex items-center justify-center mx-auto mb-4">
				<Icon className="text-white" size={24} />
			</div>
			<h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
			<p className="text-gray-600 mb-4">{description}</p>
			{actionButton && (
				<Link
					to={actionButton.to}
					className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-slate-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-slate-700 transition-all duration-200"
				>
					<actionButton.icon size={16} />
					{actionButton.text}
				</Link>
			)}
		</div>
	</div>
);

export default EmptyState;
