use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("The computation was aborted")]
    AbortedComputation,
    #[msg("Cluster not set")]
    ClusterNotSet,
    #[msg("Deposit Invalid")]
    DepositInvalid,
    #[msg("Max Transfer Amount Exceeded")]
    MaxTransferAmountExceeded,
}
